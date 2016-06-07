(function () {
    "use strict";

    angular.module('cc-appinsights')
        .provider('ccAppInsights', appInsightsProvider);

    appInsightsProvider.$inject = ['$provide', '$httpProvider'];

    function appInsightsProvider($provide, $httpProvider) {

        var provider = this;

        init();

        ////////////

        function init() {
            provider.configOptions = {};
            provider.defaultOptions = {
                /**
                 * If true, automatically start the service during the run phase of the angular application.
                 * Set false if you want to take control over when this service will start (default=true) 
                 */
                autoRun: true,
                /**
                 * If true, decorate the $exceptionHandler service to automatically send exceptions
                 * (default=true) 
                 */
                autoTrackExceptions: true,
                /**
                 * If true, automatically send a page view event on each $route change (default=true) 
                 */
                autoTrackPageViews: true,
                /**
                 * If true, add the current page operation id as a http header 
                 * (default header 'ai-pv-opid')  (default=false).
                 * Warning: this will trigger a CORS pre-flight options requests when the ajax request
                 * is being made to an origin not the one that served this script
                 * See also: 'disableCorrelationHeaders' options on the application insights SDK for
                 * further correlation options 
                 */
                addPageViewCorrelationHeader: false,
                ajaxTelemetryInitializers: [],
                /**
                 * Telemtry initializers that should run when a page view item is about to be sent;
                 * ccDefaultPageViewTelemetryInitializer will be included by default
                 */
                pageViewTelemetryInitializers: ['ccDefaultPageViewTelemetryInitializer'],
                /**
                 * Telemtry initializers that should run when any telemetry item is about to be sent
                 */
                telemetryInitializers: []
            };
            provider.$get = ['$injector', function ($injector) {
                return $injector.instantiate(AppInsights, { configOptions: provider.configOptions });
            }];
            provider.configure = configure;
        }

        function configure(options) {
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

        function decorateExceptionHandler($delegate, $window) {

            // note: using a direct reference to appInsights SDK (ie via $window) as worried about 
            // an exception being thrown by appInsights angular service itself

            return function appInsightsExceptionHandler(exception, cause) {
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

        function extend(target/*, sources*/) {
            var sources = [].slice.call(arguments, 1);
            for (var i = 0; i < sources.length; i++) {
                var source = sources[i] || {};
                for (var prop in source) {
                    if (source.hasOwnProperty(prop)) {
                        target[prop] = source[prop];
                    }
                }
            }
            return target;
        }
    }

    AppInsights.$inject = ['$rootScope', '$location', '$window', 'configOptions', '$injector'];

    function AppInsights($rootScope, $location, $window, configOptions, $injector) {
        var appInsights = $window.appInsights,
            previousOperation,
            pageInProgress,
            hasRun = false;

        this.configOptions = configOptions;
        this.service = appInsights;
        this.run = run;

        ////////////


        function run() {
            if (hasRun || !appInsights) return;

            hasRun = true;

            addTelemetryInitializers(configOptions.pageViewTelemetryInitializers, isPageViewTelemetryItem);
            addTelemetryInitializers(configOptions.ajaxTelemetryInitializers, isAjaxTelemetryItem);
            addTelemetryInitializers(configOptions.telemetryInitializers);

            if (configOptions.autoTrackPageViews) {
                autoTrackPageViews();
            }
        }


        // private functions

        function addTelemetryInitializers(initializers, condition) {
            if (!initializers) return;

            initializers.forEach(function (initializer) {
                if (typeof initializer === 'string') {
                    initializer = $injector.get(initializer)
                }
                var ti = condition != null
                    ? createConditionalTelemetryInitializer(initializer, condition)
                    : initializer;
                appInsights.context.addTelemetryInitializer(ti);
            });
        }

        function autoTrackPageViews() {
            $rootScope.$on('$routeChangeStart', trackNewPage);
            $rootScope.$on('$routeChangeSuccess', recordPageView);
            $rootScope.$on('$routeChangeError', function () {
                recordPageView();
                appInsights.context.operation = previousOperation;
            });
        }

        function createConditionalTelemetryInitializer(initializer, condition) {
            return function (envelope) {
                if (!condition(envelope)) return;

                return initializer.apply(null, arguments);
            };
        }

        function isPageViewTelemetryItem(envelope) {
            return envelope.name === Microsoft.ApplicationInsights.Telemetry.PageView.envelopeType;
        }

        function isAjaxTelemetryItem(envelope) {
            return envelope.name === Microsoft.ApplicationInsights.Telemetry.RemoteDependencyData.envelopeType &&
                envelope.data.baseData.dependencyKind === 1;
        }

        function recordPageView(evt, route) {
            if (pageInProgress == null) return;

            appInsights.stopTrackPage(pageInProgress.name, pageInProgress.url);
        }

        function trackNewPage(evt, route) {
            // tried to navigate to a route that does not exist, requires url normalization, 
            // or is null as a result of an error; either way a route change shouldn't be recorded
            if (!route || route.redirectTo != null) {
                pageInProgress = null;
                return;
            }

            pageInProgress = { name: $location.path() || '/', url: $location.url() || '/' };
            var newOperation = new $window.Microsoft.ApplicationInsights.Context.Operation();
            newOperation.name = pageInProgress.name;

            previousOperation = appInsights.context.operation;
            appInsights.context.operation = newOperation;

            // start timer for page load timings
            appInsights.startTrackPage(pageInProgress.name);
        }
    }
})();