namespace cc.appinsights {
    export type AugmentedWindow = ng.IWindowService & {
        appInsights: Microsoft.ApplicationInsights.AppInsights,
        Microsoft: typeof Microsoft
    };
}