(function () {
    "use strict";

    angular.module('cc-appinsights')
        .run(maybeAutoRun);


    maybeAutoRun.$inject = ['ccAppInsights'];

    function maybeAutoRun(appInsights) {
        if (!appInsights.configOptions.autoRun) return;

        appInsights.run();
    }
})();