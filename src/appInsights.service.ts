namespace cc.appinsights {
    'use strict';

    export class AppInsights {
        static $inject = ['$rootScope', '$location', '$window', 'configOptions', '$injector'];

        private appInsights: Microsoft.ApplicationInsights.AppInsights;
        private previousOperation: Microsoft.ApplicationInsights.Context.Operation;
        private pageInProgress: { name: string, url: string } | null;
        private hasRun = false;
        public service: Microsoft.ApplicationInsights.AppInsights;

        constructor(private $rootScope: ng.IRootScopeService,
            private $location: ng.ILocationService,
            private $window: CustomWindow,
            public configOptions: AppInsightsConfig,
            private $injector: ng.auto.IInjectorService) {

            this.appInsights = $window.appInsights;
            this.service = $window.appInsights
        }

        public run() {
            if (this.hasRun || !this.appInsights) return;

            this.hasRun = true;

            // todo: consider changing pattern of making configOptions have optional members, then remove '[]'
            this.addTelemetryInitializers(
                this.configOptions.pageViewTelemetryInitializers || [], 
                (envelope) => this.isPageViewTelemetryItem(envelope));
            this.addTelemetryInitializers(
                this.configOptions.ajaxTelemetryInitializers || [], 
                (envelope) => this.isAjaxTelemetryItem(envelope));
            this.addTelemetryInitializers(this.configOptions.telemetryInitializers || []);

            if (this.configOptions.autoTrackPageViews) {
                this.autoTrackPageViews();
            }
        }

        private addTelemetryInitializers(initializers: Array<TelemetryInitializer | string>, condition?: TelemetryItemSelector) {
            if (!initializers) return;

            initializers.forEach(initializer => {
                if (typeof initializer === 'string') {
                    initializer = this.$injector.get<TelemetryInitializer>(initializer)
                }
                const ti = condition != null
                    ? this.createConditionalTelemetryInitializer(initializer, condition)
                    : initializer;
                this.appInsights.context.addTelemetryInitializer(ti);
            });
        }

        private autoTrackPageViews() {
            this.$rootScope.$on('$routeChangeStart', (evt: ng.IAngularEvent, next: ng.route.IRoute) => {
                this.trackNewPage(evt, next);
            });
            this.$rootScope.$on('$routeChangeSuccess', (evt: ng.IAngularEvent, current: ng.route.IRoute) => {
                this.recordPageView(evt, current);
            });
            this.$rootScope.$on('$routeChangeError', (evt: ng.IAngularEvent, route: ng.route.IRoute) => {
                this.recordPageView(evt, route);
                this.appInsights.context.operation = this.previousOperation;
            });
        }

        private createConditionalTelemetryInitializer(initializer: TelemetryInitializer, condition: TelemetryItemSelector): TelemetryInitializer {
            return function (envelope) {
                if (!condition(envelope)) return;

                return initializer.apply(null, arguments);
            };
        }

        private isPageViewTelemetryItem(envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) {
            return envelope.name === Microsoft.ApplicationInsights.Telemetry.PageView.envelopeType;
        }

        private isAjaxTelemetryItem(envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) {
            return envelope.name === Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData.envelopeType &&
                envelope.data.baseData.dependencyKind === AI.DependencyKind.Http;
        }

        private recordPageView(evt: ng.IAngularEvent, route: ng.route.IRoute) {
            if (this.pageInProgress == null) return;

            this.appInsights.stopTrackPage(this.pageInProgress.name, this.pageInProgress.url);
        }

        private trackNewPage(evt: ng.IAngularEvent, route: ng.route.IRoute) {
            // tried to navigate to a route that does not exist, requires url normalization, 
            // or is null as a result of an error; either way a route change shouldn't be recorded
            if (!route || route.redirectTo != null) {
                this.pageInProgress = null;
                return;
            }

            this.pageInProgress = { name: this.$location.path() || '/', url: this.$location.url() || '/' };
            const newOperation = new this.$window.Microsoft.ApplicationInsights.Context.Operation();
            newOperation.name = this.pageInProgress.name;

            this.previousOperation = this.appInsights.context.operation;
            this.appInsights.context.operation = newOperation;

            // start timer for page load timings
            this.appInsights.startTrackPage(this.pageInProgress.name);
        }
    }
}