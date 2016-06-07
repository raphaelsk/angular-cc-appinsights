(function () {
    "use strict";

    angular.module('cc-appinsights')
        .service('ccAppInsightsHttpInterceptor', AppInsightsHttpInterceptor);

    AppInsightsHttpInterceptor.$inject = ['ccAppInsights'];

    function AppInsightsHttpInterceptor(appInsights) {

        var impl = appInsights.service,
            pageViewIdHeaderKey;

        init();
        this.request = impl ? addHeaders : angular.identity;

        function init() {
            pageViewIdHeaderKey = 'ai-pv-opid';
            if (typeof appInsights.configOptions.addPageViewCorrelationHeader === "string") {
                pageViewIdHeaderKey = appInsights.configOptions.addPageViewCorrelationHeader;
            }
        }

        ///////////

        function addHeaders(config) {
            config.headers[pageViewIdHeaderKey] = impl.context.operation.id;
            return config;
        }
    }
})();