declare namespace cc.appinsights {
}
declare namespace cc.appinsights {
    class AppInsightsProvider {
        private $provide;
        private $httpProvider;
        static $inject: string[];
        configOptions: AppInsightsConfig;
        defaultOptions: AppInsightsConfig;
        constructor($provide: ng.auto.IProvideService, $httpProvider: ng.IHttpProvider);
        $get($injector: ng.auto.IInjectorService): {};
        configure(options: AppInsightsConfig): void;
        private decorateExceptionHandler($delegate, $window);
        private extend(target, ...sources);
    }
}
declare namespace cc.appinsights {
    class AppInsights {
        private $rootScope;
        private $location;
        private $window;
        configOptions: AppInsightsConfig;
        private $injector;
        static $inject: string[];
        private appInsights;
        private previousOperation;
        private pageInProgress;
        private hasRun;
        service: Microsoft.ApplicationInsights.AppInsights;
        constructor($rootScope: ng.IRootScopeService, $location: ng.ILocationService, $window: CustomWindow, configOptions: AppInsightsConfig, $injector: ng.auto.IInjectorService);
        run(): void;
        private addTelemetryInitializers(initializers, condition?);
        private autoTrackPageViews();
        private createConditionalTelemetryInitializer(initializer, condition);
        private isPageViewTelemetryItem(envelope);
        private isAjaxTelemetryItem(envelope);
        private recordPageView(evt, route);
        private trackNewPage(evt, route);
    }
}
declare namespace cc.appinsights {
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
        ajaxTelemetryInitializers?: Array<TelemetryInitializer | string>;
        /**
         * Telemtry initializers that should run when a page view item is about to be sent;
         * ccDefaultPageViewTelemetryInitializer will be included by default
         */
        pageViewTelemetryInitializers?: Array<TelemetryInitializer | string>;
        /**
         * Telemtry initializers that should run when any telemetry item is about to be sent
         */
        telemetryInitializers?: Array<TelemetryInitializer | string>;
    }
}
declare namespace cc.appinsights {
}
declare namespace cc.appinsights {
}
declare namespace cc.appinsights {
}
