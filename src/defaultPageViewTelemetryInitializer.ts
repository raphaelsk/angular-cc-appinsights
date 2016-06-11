namespace cc.appinsights {
    'use strict';

    angular.module('cc-appinsights')
        .factory('_ccDefaultPageViewTelemetryInitializer', _defaultPageViewTelemetryInitializer);

    _defaultPageViewTelemetryInitializer.$inject = ['$route'];

    function _defaultPageViewTelemetryInitializer($route: ng.route.IRouteService) {

        return setPageViewProperties;

        function parseControllerName(name?: string|angular.route.InlineAnnotatedFunction) {
            if (typeof name !== "string") {
                return null;
            }
            return name.split(' as')[0];
        }

        function setPageViewProperties(envelope: Microsoft.Telemetry.Envelope) {
            if (!$route.current) return;

            var pageView = envelope.data.baseData;
            pageView.properties = pageView.properties || {};
            pageView.properties["controller"] = parseControllerName($route.current.controller);
            pageView.properties["routePath"] = $route.current.originalPath || "/";
        }
    }
}