namespace cc.appinsights {
    'use strict';
    
    // todo: remove explicit class once appInsightsProvider is refactored to be a class
    angular.module('cc-appinsights')
        .provider('ccAppInsights', appInsightsProvider as ng.IServiceProviderFactory);

    appInsightsProvider.$inject = ['$provide', '$httpProvider'];

    type CustomWindow = ng.IWindowService & {
        appInsights: Microsoft.ApplicationInsights.AppInsights,
        Microsoft: typeof Microsoft
    };

    type TelemetryInitializer = (envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) => boolean;
    type TelemetryItemSelector = (envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) => boolean;

    interface AppInsightsConfig {
        /**
         * If true, automatically start the service during the run phase of the angular application.
         * Set false if you want to take control over when this service will start (default=true) 
         */
        autoRun?: boolean;
        /**
         * If true, decorate the $exceptionHandler service to automatically send exceptions
         * (default=true) 
         */
        autoTrackExceptions?: boolean;
        /**
         * If true, automatically send a page view event on each $route change (default=true) 
         */
        autoTrackPageViews?: boolean;
        /**
         * If true, add the current page operation id as a http header 
         * (default header 'ai-pv-opid')  (default=false).
         * Warning: this will trigger a CORS pre-flight options requests when the ajax request
         * is being made to an origin not the one that served this script
         * See also: 'disableCorrelationHeaders' options on the application insights SDK for
         * further correlation options 
         */
        addPageViewCorrelationHeader?: boolean;
        ajaxTelemetryInitializers?: Array<TelemetryInitializer | string>,
        /**
         * Telemtry initializers that should run when a page view item is about to be sent;
         * ccDefaultPageViewTelemetryInitializer will be included by default
         */
        pageViewTelemetryInitializers?: Array<TelemetryInitializer | string>,
        /**
         * Telemtry initializers that should run when any telemetry item is about to be sent
         */
        telemetryInitializers?: Array<TelemetryInitializer | string>
    }

    function appInsightsProvider($provide: ng.auto.IProvideService, $httpProvider: ng.IHttpProvider) {

        const provider: ng.IServiceProvider & {
            configOptions: AppInsightsConfig;
            defaultOptions: AppInsightsConfig;
            configure(options: AppInsightsConfig): void;
        } = this;

        init();

        ////////////

        function init() {
            provider.configOptions = {};
            provider.defaultOptions = {
                autoRun: true,
                autoTrackExceptions: true,
                autoTrackPageViews: true,
                addPageViewCorrelationHeader: false,
                ajaxTelemetryInitializers: [],
                pageViewTelemetryInitializers: ['ccDefaultPageViewTelemetryInitializer'],
                telemetryInitializers: []
            };
            provider.$get = ['$injector', function ($injector: ng.auto.IInjectorService) {
                return $injector.instantiate(AppInsights, { configOptions: provider.configOptions });
            }];
            provider.configure = configure;
        }

        function configure(options: AppInsightsConfig) {
            // todo: replace extend with a Object.assign (will require a polyfill for older browsers)
            provider.configOptions = extend(provider.configOptions, provider.defaultOptions, options);
            if (provider.configOptions.autoTrackExceptions) {
                $provide.decorator("$exceptionHandler", decorateExceptionHandler);
            }
            if (provider.configOptions.addPageViewCorrelationHeader) {
                $httpProvider.interceptors.push('ccAppInsightsHttpInterceptor');
            }
        }

        decorateExceptionHandler.$inject = ['$delegate', '$window'];

        function decorateExceptionHandler(
            $delegate: ng.IExceptionHandlerService,
            $window: CustomWindow) {

            // note: using a direct reference to appInsights SDK (ie via $window) as worried about 
            // an exception being thrown by appInsights angular service itself

            return function appInsightsExceptionHandler(exception: Error, cause: string) {
                $delegate(exception, cause);
                if ($window.appInsights) {
                    try {
                        $window.appInsights.trackException(exception);
                    } catch (ex) {
                        $delegate(ex, 'Application Insights');
                    }
                }
            };
        }

        function extend(target: any, ...sources: any[]) {
            for (let i = 0; i < sources.length; i++) {
                let source = sources[i] || {};
                for (let prop in source) {
                    if (source.hasOwnProperty(prop)) {
                        target[prop] = source[prop];
                    }
                }
            }
            return target;
        }
    }

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