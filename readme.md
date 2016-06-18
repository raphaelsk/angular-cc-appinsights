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

### From NPM

```cmd
npm install angular-cc-appinsights --save
```

#### From Source
```cmd
> git clone https://github.com/christianacca/angular-cc-appinsights.git
> cd angular-cc-appinsights
> npm install
> npm run build:full
```

The compiled `angular-cc-appinsights` library will be in the **dist/** folder.


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

* In an angular config function, configure the `ccAppInsightsProvider`:

**JS**
```js
angular.module('myApp').config(configWithAppInsigths);

configWithAppInsigths.$inject = ['ccAppInsightsProvider'];

function configWithAppInsigths(appInsightsProvider) {
	appInsightsProvider.configure(); 
}
```
**Typescript**
```ts
/// <reference path="path/to/angular-cc-appinsights.d.ts" />

angular.module('myApp').config(configWithAppInsigths);

configWithAppInsigths.$inject = ['ccAppInsightsProvider'];

function configWithAppInsigths(appInsightsProvider: cc.appinsights.AppInsightsProvider) {
    appInsightsProvider.configure();
}
```


## API Reference

See [api-reference.md](api-reference.md)