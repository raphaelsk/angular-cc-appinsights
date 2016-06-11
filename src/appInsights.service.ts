namespace cc.appinsights {
    'use strict';

    /**
     * Used to access the global instance of the AppInsights class created by the official SDK
     */
    export class AppInsights {
        static $inject = ['$rootScope', '$location', '$window', 'configOptions', '$injector'];

        private _appInsights: Microsoft.ApplicationInsights.AppInsights;
        private _previousOperation: Microsoft.ApplicationInsights.Context.Operation;
        private _pageInProgress: { name: string, url: string } | null;
        private _hasRun = false;
        /**
         * A reference to the global instance of the AppInsights class created by the SDK library.
         * 
         * This instance provides the API used to explicitly log specific telemetry events and metrics
         * within an angular application.
         */
        public service: Microsoft.ApplicationInsights.AppInsights;

        constructor(private _$rootScope: ng.IRootScopeService,
            private _$location: ng.ILocationService,
            private _$window: CustomWindow,
            /**
             * A reference to `AppInsightsProvider.configOptions`
             */
            public configOptions: AppInsightsConfig,
            private _$injector: ng.auto.IInjectorService) {

            this._appInsights = _$window.appInsights;
            this.service = _$window.appInsights
        }

        /**
         * Applies the configuration options to the module during the run phase of the angular application.
         * For example, adds any angular services registered as telemetry initializers to the SDK.
         * 
         * Typically you will not need to call this method unless you have explicitly set `AppInsightsConfig.autoRun`
         * to `false`.
         */
        public run() {
            if (this._hasRun || !this._appInsights) return;

            this._hasRun = true;

            // todo: consider changing pattern of making configOptions have optional members, then remove '[]'
            this._addTelemetryInitializers(
                this.configOptions.pageViewTelemetryInitializers || [], 
                (envelope) => this._isPageViewTelemetryItem(envelope));
            this._addTelemetryInitializers(
                this.configOptions.ajaxTelemetryInitializers || [], 
                (envelope) => this._isAjaxTelemetryItem(envelope));
            this._addTelemetryInitializers(this.configOptions.telemetryInitializers || []);

            if (this.configOptions.autoTrackPageViews) {
                this._autoTrackPageViews();
            }
        }

        private _addTelemetryInitializers(initializers: Array<TelemetryInitializer | string>, condition?: TelemetryItemSelector) {
            if (!initializers) return;

            initializers.forEach(initializer => {
                if (typeof initializer === 'string') {
                    initializer = this._$injector.get<TelemetryInitializer>(initializer)
                }
                const ti = condition != null
                    ? this._createConditionalTelemetryInitializer(initializer, condition)
                    : initializer;
                this._appInsights.context.addTelemetryInitializer(ti);
            });
        }

        private _autoTrackPageViews() {
            this._$rootScope.$on('$routeChangeStart', (evt: ng.IAngularEvent, next: ng.route.IRoute) => {
                this._trackNewPage(evt, next);
            });
            this._$rootScope.$on('$routeChangeSuccess', (evt: ng.IAngularEvent, current: ng.route.IRoute) => {
                this._recordPageView(evt, current);
            });
            this._$rootScope.$on('$routeChangeError', (evt: ng.IAngularEvent, route: ng.route.IRoute) => {
                this._recordPageView(evt, route);
                this._appInsights.context.operation = this._previousOperation;
            });
        }

        private _createConditionalTelemetryInitializer(initializer: TelemetryInitializer, condition: TelemetryItemSelector): TelemetryInitializer {
            return function (envelope) {
                if (!condition(envelope)) return;

                return initializer.apply(null, arguments);
            };
        }

        private _isPageViewTelemetryItem(envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) {
            return envelope.name === Microsoft.ApplicationInsights.Telemetry.PageView.envelopeType;
        }

        private _isAjaxTelemetryItem(envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) {
            return envelope.name === Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData.envelopeType &&
                envelope.data.baseData.dependencyKind === AI.DependencyKind.Http;
        }

        private _recordPageView(evt: ng.IAngularEvent, route: ng.route.IRoute) {
            if (this._pageInProgress == null) return;

            this._appInsights.stopTrackPage(this._pageInProgress.name, this._pageInProgress.url);
        }

        private _trackNewPage(evt: ng.IAngularEvent, route: ng.route.IRoute) {
            // tried to navigate to a route that does not exist, requires url normalization, 
            // or is null as a result of an error; either way a route change shouldn't be recorded
            if (!route || route.redirectTo != null) {
                this._pageInProgress = null;
                return;
            }

            this._pageInProgress = { name: this._$location.path() || '/', url: this._$location.url() || '/' };
            const newOperation = new this._$window.Microsoft.ApplicationInsights.Context.Operation();
            newOperation.name = this._pageInProgress.name;

            this._previousOperation = this._appInsights.context.operation;
            this._appInsights.context.operation = newOperation;

            // start timer for page load timings
            this._appInsights.startTrackPage(this._pageInProgress.name);
        }
    }
}