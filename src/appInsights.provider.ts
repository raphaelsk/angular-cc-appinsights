namespace cc.appinsights {
    'use strict';

    export class AppInsightsProvider {
        static $inject = ['$provide', '$httpProvider'];

        /**
         * The final configuration options that were used to configure the module. 
         * Note: this object will only be assigned values only once the `configure` method has been called.
         */
        public configOptions: AppInsightsConfig = {};
        /**
         * The default options values that will be used if not overridden by options supplied by a call to `configure`.
         */
        public defaultOptions: AppInsightsConfig = {
                autoRun: true,
                autoTrackExceptions: true,
                autoTrackPageViews: true,
                addPageViewCorrelationHeader: false,
                ajaxTelemetryInitializers: [],
                pageViewTelemetryInitializers: ['_ccDefaultPageViewTelemetryInitializer'],
                telemetryInitializers: []
            };

        constructor(private _$provide: ng.auto.IProvideService, private _$httpProvider: ng.IHttpProvider) {
            this.$get.$inject = ['$injector'];
            this._decorateExceptionHandler.$inject = ['$delegate', '$window'];
        }

        public $get($injector: ng.auto.IInjectorService) {
            return $injector.instantiate(AppInsights, { configOptions: this.configOptions });
        }

        /**
         * Configures the `angular-cc-appinsights` module.
         * Sets `configOptions` by merging the values from `defaultOptions` with the overriding values 
         * from the `AppInsightsConfig` supplied.
         */
        public configure(options: AppInsightsConfig) {
            // todo: replace extend with a Object.assign (will require a polyfill for older browsers)
            this.configOptions = this._extend(this.configOptions, this.defaultOptions, options);
            if (this.configOptions.autoTrackExceptions) {
                this._$provide.decorator("$exceptionHandler", this._decorateExceptionHandler);
            }
            if (this.configOptions.addPageViewCorrelationHeader) {
                this._$httpProvider.interceptors.push('_ccAppInsightsHttpInterceptor');
            }
        }

        private _decorateExceptionHandler(
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

        private _extend(target: any, ...sources: any[]) {
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
}