
declare namespace AI {
    export enum DependencyKind {
        SQL = 0,
        Http = 1,
        Other = 2,
    }
}
declare namespace Microsoft.Telemetry {
    export interface Base {
        baseData: { 
            dependencyKind: AI.DependencyKind;
            properties: { [property: string] : any } 
        }
    }
}
declare namespace Microsoft.ApplicationInsights {
    export namespace Telemetry {
        // missing PageView class and its static members
        export namespace PageView {
            let envelopeType: string;
        }
        // missing PageView class and its static members
        export namespace RemoteDependencyData {
            let envelopeType: string;
        }
    }
}