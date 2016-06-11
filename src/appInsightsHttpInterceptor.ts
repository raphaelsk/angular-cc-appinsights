namespace cc.appinsights {
    'use strict';

    export class _AppInsightsHttpInterceptor {
        static $inject = ['ccAppInsights']
        private _impl: Microsoft.ApplicationInsights.AppInsights;
        private _pageViewIdHeaderKey: string;
        public request: (config: ng.IRequestConfig) => ng.IRequestConfig;

        constructor(appInsights: cc.appinsights.AppInsights) {
            this._impl = appInsights.service;
            if (typeof appInsights.configOptions.addPageViewCorrelationHeader === "string") {
                this._pageViewIdHeaderKey = appInsights.configOptions.addPageViewCorrelationHeader;
            } else {
                this._pageViewIdHeaderKey = 'ai-pv-opid';
            }
            this.request = this._impl ? (config) => this._addHeaders(config) : angular.identity;
        }

        private _addHeaders(config: ng.IRequestConfig) {
            if (config.headers && this._impl) {
                config.headers[this._pageViewIdHeaderKey] = this._impl.context.operation.id;
            }
            return config;
        }
    }
}