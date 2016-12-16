export class TRON_GLOBAL {
    public static get fnExecSQL():string { return "fnExecSQL"; }
    public static get project():string { return "project"; }
    public static get fnSaveOutput():string { return "fnSaveOutput"; }
    public static get fnOpenProject():string { return "fnOpenProject"; }
} 

export class TRON_EVENT {
    public static get projectOpened():string { return "projectOpened"; }
    public static get tablesChanged():string { return "tablesChanged"; }
    public static get columnsChanged():string { return "columnsChanged"; }
    public static get rowsChanged():string { return "rowsChanged"; }
    public static get activate():string { return "activate"; }
    public static get deactivate():string { return "deactivate"; }
    public static get projectSaved():string { return "projectSaved"; }
} 
