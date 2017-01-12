export class TRON_GLOBAL {
    public static get fnExecSQL():string { return "fnExecSQL"; }
    public static get fnVerifyConnection():string { return "fnVerifyConnection"; }
    public static get fnSaveProject():string { return "fnSaveProject"; }
    public static get fnOpenProject():string { return "fnOpenProject"; }
    public static get fnWriteSqlToFile():string { return "fnWriteSqlToFile"; }
    public static get fnMsgBox():string { return "fnMsgBox"; }
} 

export class TRON_EVENT {
    public static get projectOpened():string { return "projectOpened"; }
    public static get refresh():string { return "refresh"; }
    public static get activate():string { return "activate"; }
} 

export class NAME_TYPE {
    public static get FN():string { return "FN"; }
    public static get LN():string { return "LN"; }
}
