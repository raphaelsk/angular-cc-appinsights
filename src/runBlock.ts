namespace cc.appinsights {
    'use strict';

    angular.module('cc-appinsights')
        .run(maybeAutoRun);


    maybeAutoRun.$inject = ['ccAppInsights'];

    function maybeAutoRun(appInsights: cc.appinsights.AppInsights) {
        if (!appInsights.configOptions.autoRun) return;

        appInsights.run();
    }
}