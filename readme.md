# angular-cc-appinsights

> An AngularJS module for integrating Microsoft's Application Insights within a SPA

## Core features

* Configure the official Application Insights (AI) SDK with telemetry initializers that are angular services
* Automatically track page views in AI on every client-side route change
* Automatically track exceptions in AI that are sent to the angular $exceptionHandler service

## Getting Started

### Prerequisites

- A Microsoft Application Insights Instrumentation Key:
    - This can be obtained from https://portal.azure.com, and registering an Application Insights resource.
    - Following the official guide : [Create a new Application Insights resource](https://azure.microsoft.com/en-gb/documentation/articles/app-insights-create-new-resource/)


### Installation 

#### From Source
```
> git clone https://github.com/christianacca/angular-cc-appinsights.git
> cd angular-cc-appinsights/dist
```
Copy the *angular-cc-appinsights.js* or *angular-cc-appinsights.min.js* file into your project


### Setup

### 1. Add and initialize the Application Insights SDK

* Add a script reference to the Application Insights SDK in your main html file. Make sure it is one of the first scripts to load:
```html
	<script src="path/to/app-insights/ai.0.js"></script>
```

Note: you will find the latest version of the SDK in the dist folder of the [official github repo](https://github.com/Microsoft/ApplicationInsights-JS)

* Immediately after the script reference above, add another script that initializes the Application Insights SDK. A minimal example of this script:
```js
var snippet = {
	config: {
		instrumentationKey: "YOUR_KEY_HERE"
	}
};
var init = new Microsoft.ApplicationInsights.Initialization(snippet);
var appInsights = init.loadAppInsights();
```

### 2. Add cc-appinsights angular module

* Add script reference to `cc-appinsights` javascript:
```html
	<script src="path/to/angular-cc-appinsights.min.js"></script>
```

* Where you declare your app module, add `cc-appinsights`:
```js
angular.module('myApp', ['cc-appinsights']);
```

* In a angular config block, configure the `ccAppInsightsProvider`:
```js
angular.module('myApp').config(function(ccAppInsightsProvider) {
	ccAppInsightsProvider.configure(); 
});
```

