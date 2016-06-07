(function () {
    "use strict";

    angular.module('cc-appinsights')
        .factory('ccDefaultPageViewTelemetryInitializer', defaultPageViewTelemetryInitializer);

    defaultPageViewTelemetryInitializer.$inject = ['$route'];

    function defaultPageViewTelemetryInitializer($route) {

        return setPageViewProperties;

        function parseControllerName(name) {
            if (name == null || name.indexOf(' as') === -1) return name;

            return name.split(' as')[0];
        }

        function setPageViewProperties(envelope) {
            if (!$route.current) return;

            var pageView = envelope.data.baseData;
            pageView.properties = pageView.properties || {};
            pageView.properties.controller = parseControllerName($route.current.controller);
            pageView.properties.routePath = $route.current.originalPath || "/";
        }
    }
})();