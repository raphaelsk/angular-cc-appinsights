// originalPath looks to be undocumented and therefore not added to d.ts; we
//  use it therefore need to extend ourselves 
declare namespace angular.route {
    export interface ICurrentRoute {
        originalPath: string;
    }
}