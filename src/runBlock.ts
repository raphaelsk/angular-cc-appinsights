namespace cc.appinsights {
    'use strict';

    _maybeAutoRun.$inject = ['ccAppInsights'];

    export function _maybeAutoRun(appInsights: cc.appinsights.AppInsights) {
        if (!appInsights.configOptions.autoRun) return;

        appInsights.run();
    }
}