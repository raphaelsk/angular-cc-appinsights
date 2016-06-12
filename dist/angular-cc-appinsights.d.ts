declare namespace cc.appinsights {
    class AppInsightsProvider {
        private _$provide;
        private _$httpProvider;
        static $inject: string[];
        /**
         * The final configuration options that were used to configure the module.
         * Note: this object will only be assigned values only once the `configure` method has been called.
         */
        configOptions: AppInsightsConfig;
        /**
         * The default options values that will be used if not overridden by options supplied by a call to `configure`.
         */
        defaultOptions: AppInsightsConfig;
        constructor(_$provide: ng.auto.IProvideService, _$httpProvider: ng.IHttpProvider);
        $get($injector: ng.auto.IInjectorService): {};
        /**
         * Configures the `angular-cc-appinsights` module.
         * Sets `configOptions` by merging the values from `defaultOptions` with the overriding values
         * from the `AppInsightsConfig` supplied.
         */
        configure(options: AppInsightsConfig): void;
        private _decorateExceptionHandler($delegate, $window);
        private _extend(target, ...sources);
    }
}
declare namespace cc.appinsights {
    /**
     * Used to access the global instance of the AppInsights class created by the official SDK
     */
    class AppInsights {
        private _$rootScope;
        private _$location;
        private _$window;
        /**
         * A reference to `AppInsightsProvider.configOptions`
         */
        configOptions: AppInsightsConfig;
        private _$injector;
        static $inject: string[];
        private _appInsights;
        private _previousOperation;
        private _pageInProgress;
        private _hasRun;
        /**
         * A reference to the global instance of the AppInsights class created by the SDK library.
         *
         * This instance provides the API used to explicitly log specific telemetry events and metrics
         * within an angular application.
         */
        service: Microsoft.ApplicationInsights.AppInsights;
        constructor(_$rootScope: ng.IRootScopeService, _$location: ng.ILocationService, _$window: AugmentedWindow, 
            /**
             * A reference to `AppInsightsProvider.configOptions`
             */
            configOptions: AppInsightsConfig, _$injector: ng.auto.IInjectorService);
        /**
         * Applies the configuration options to the module during the run phase of the angular application.
         * For example, adds any angular services registered as telemetry initializers to the SDK.
         *
         * Typically you will not need to call this method unless you have explicitly set `AppInsightsConfig.autoRun`
         * to `false`.
         */
        run(): void;
        private _addTelemetryInitializers(initializers, condition?);
        private _autoTrackPageViews();
        private _createConditionalTelemetryInitializer(initializer, condition);
        private _isPageViewTelemetryItem(envelope);
        private _isAjaxTelemetryItem(envelope);
        private _recordPageView(evt, route);
        private _trackNewPage(evt, route);
    }
}
declare namespace cc.appinsights {
    type TelemetryInitializer = (envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) => boolean;
    type TelemetryItemSelector = (envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) => boolean;
    /**
     * Defines the options used to configure the module.
     */
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
         * _ccDefaultPageViewTelemetryInitializer will be included by default
         */
        pageViewTelemetryInitializers?: Array<TelemetryInitializer | string>;
        /**
         * Telemtry initializers that should run when any telemetry item is about to be sent
         */
        telemetryInitializers?: Array<TelemetryInitializer | string>;
    }
}
declare namespace cc.appinsights {
    class _AppInsightsHttpInterceptor {
        static $inject: string[];
        private _impl;
        private _pageViewIdHeaderKey;
        request: (config: ng.IRequestConfig) => ng.IRequestConfig;
        constructor(appInsights: cc.appinsights.AppInsights);
        private _addHeaders(config);
    }
}
declare namespace cc.appinsights {
    function _defaultPageViewTelemetryInitializer($route: ng.route.IRouteService): TelemetryInitializer;
}
declare namespace cc.appinsights {
    function _maybeAutoRun(appInsights: cc.appinsights.AppInsights): void;
}
declare namespace cc.appinsights {
    let module: ng.IModule;
}
declare namespace cc.appinsights {
    type AugmentedWindow = ng.IWindowService & {
        appInsights: Microsoft.ApplicationInsights.AppInsights;
        Microsoft: typeof Microsoft;
    };
}
