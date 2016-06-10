namespace cc.appinsights {
    'use strict';

    class AppInsightsHttpInterceptor {
        static $inject = ['ccAppInsights']
        private impl: Microsoft.ApplicationInsights.AppInsights;
        private pageViewIdHeaderKey: string;
        public request: (config: ng.IRequestConfig) => ng.IRequestConfig;

        constructor(appInsights: cc.appinsights.AppInsights) {
            this.impl = appInsights.service;
            if (typeof appInsights.configOptions.addPageViewCorrelationHeader === "string") {
                this.pageViewIdHeaderKey = appInsights.configOptions.addPageViewCorrelationHeader;
            } else {
                this.pageViewIdHeaderKey = 'ai-pv-opid';
            }
            this.request = this.impl ? (config) => this.addHeaders(config) : angular.identity;
        }

        private addHeaders(config: ng.IRequestConfig) {
            if (config.headers && this.impl) {
                config.headers[this.pageViewIdHeaderKey] = this.impl.context.operation.id;
            }
            return config;
        }
    }

    angular.module('cc-appinsights')
        .service('ccAppInsightsHttpInterceptor', AppInsightsHttpInterceptor);
}