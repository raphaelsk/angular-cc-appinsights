# API References

`angular-cc-appinsights` module has a small API. This is because it's primary purpose is an integration module - adapting the official 
Application Insights SDK to work in the context of an angular SPA application.

## class AppInsightsProvider

Used to configure the `angular-cc-appinsights` module.

Inject an instance of `AppInsightsProvider` class:

```ts
angular.module('myApp').config(myConfig);

myConfig.$inject = ['ccAppInsightsProvider'];

function myConfig(ccAppInsightsProvider) {
    // snip
}
```

### configure

```ts
configure(options: AppInsightsConfig): void;
```

Configures the `angular-cc-appinsights` module. Sets `configOptions` by merging the values from `defaultOptions` with the overriding values
from the `AppInsightsConfig` supplied.

### configOptions

The final configuration options that were used to configure the module. Note: this object will only be assigned values only once the
`configure` method has been called.

### defaultOptions

The default options values that will be used if not overridden by options supplied by a call to `configure`.


## interface AppInsightsConfig

Defines the options used to configure the module.

```ts
interface AppInsightsConfig {
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
     * _ccDefaultPageViewTelemetryInitializer will be included by default
     */
    pageViewTelemetryInitializers?: Array<TelemetryInitializer | string>,
    /**
     * Telemtry initializers that should run when any telemetry item is about to be sent
     */
    telemetryInitializers?: Array<TelemetryInitializer | string>
}
```

## class AppInsights

Used to access the global instance of the AppInsights class created by the official SDK.

Inject an instance of `AppInsights` service class:

```ts
angular.module('myApp').factory('myFactory', myFactory);

myFactory.$inject = ['ccAppInsights'];

function myFactory(ccAppInsights) {
    // snip
}
```

### run

Applies the configuration options to the module during the run phase of the angular application.
For example, adds any angular services registered as telemetry initializers to the SDK.

Typically you will not need to call this method unless you have explicitly set `AppInsightsConfig.autoRun`
to `false`.

### configOptions

A reference to `AppInsightsProvider.configOptions`

### service

A reference to the global instance of the AppInsights class created by the SDK library.

This instance provides the API used to explicitly log specific telemetry events and metrics within an
angular application.