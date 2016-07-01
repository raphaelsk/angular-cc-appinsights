namespace cc.appinsights {
    'use strict';

    _defaultPageViewTelemetryInitializer.$inject = ['$state'];

    export function _defaultPageViewTelemetryInitializer($state: ng.ui.IStateService): TelemetryInitializer {

        return setPageViewProperties;

        function parseControllerName(name?: string|any) {
            if (typeof name !== "string") {
                return null;
            }
            return name.split(' as')[0];
        }

        function setPageViewProperties(envelope: Microsoft.Telemetry.Envelope) {
            if (!$state.current) return true;

            var pageView = envelope.data.baseData;
            pageView.properties = pageView.properties || {};
            pageView.properties["controller"] = parseControllerName($state.current.controller);
            pageView.properties["routePath"] = $state.current.url || "/";

            return true;
        }
    }
}