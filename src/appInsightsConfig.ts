namespace cc.appinsights {
    'use strict';
    
    export type TelemetryInitializer = (envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) => boolean;
    export type TelemetryItemSelector = (envelope: Microsoft.ApplicationInsights.Telemetry.Common.Envelope) => boolean;

    export interface AppInsightsConfig {
        /**
         * If true, automatically start the service during the run phase of the angular application.
         * Set false if you want to take control over when this service will start (default=true) 
         */
        autoRun?: boolean;
        /**
         * If true, decorate the $exceptionHandler service to automatically send exceptions
         * (default=true) 
         */
        autoTrackExceptions?: boolean;
        /**
         * If true, automatically send a page view event on each $route change (default=true) 
         */
        autoTrackPageViews?: boolean;
        /**
         * If true, add the current page operation id as a http header 
         * (default header 'ai-pv-opid')  (default=false).
         * Warning: this will trigger a CORS pre-flight options requests when the ajax request
         * is being made to an origin not the one that served this script
         * See also: 'disableCorrelationHeaders' options on the application insights SDK for
         * further correlation options 
         */
        addPageViewCorrelationHeader?: boolean;
        ajaxTelemetryInitializers?: Array<TelemetryInitializer | string>,
        /**
         * Telemtry initializers that should run when a page view item is about to be sent;
         * ccDefaultPageViewTelemetryInitializer will be included by default
         */
        pageViewTelemetryInitializers?: Array<TelemetryInitializer | string>,
        /**
         * Telemtry initializers that should run when any telemetry item is about to be sent
         */
        telemetryInitializers?: Array<TelemetryInitializer | string>
    }
}