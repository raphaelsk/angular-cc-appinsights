declare namespace cc.appinsights {
    export type CustomWindow = ng.IWindowService & {
        appInsights: Microsoft.ApplicationInsights.AppInsights,
        Microsoft: typeof Microsoft
    };
}