namespace cc.appinsights {
    'use strict';

    angular.module('cc-appinsights')
        .service('ccAppInsightsHttpInterceptor', AppInsightsHttpInterceptor);

    AppInsightsHttpInterceptor.$inject = ['ccAppInsights'];

    function AppInsightsHttpInterceptor(appInsights: cc.appinsights.AppInsights) {

        var impl = appInsights.service,
            pageViewIdHeaderKey = 'ai-pv-opid';

        init();
        this.request = impl ? addHeaders : angular.identity;

        function init() {
            if (typeof appInsights.configOptions.addPageViewCorrelationHeader === "string") {
                pageViewIdHeaderKey = appInsights.configOptions.addPageViewCorrelationHeader;
            }
        }

        ///////////

        function addHeaders(config: ng.IRequestConfig) {
            if (config.headers) {
                config.headers[pageViewIdHeaderKey] = impl.context.operation.id;
            }
            return config;
        }
    }
}