export class TRON_GLOBAL {
    public static get fnExecSQL():string { return "fnExecSQL"; }
    public static get fnExecSQL2():string { return "fnExecSQL2"; }
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

export const OBJECT_TYPES_LIST = ['U','V','P','SQL']; // Table, View, Procedure and "SQL"stomer SQL
export class OBJ_TYPE {
    public static TB = "U";
    public static VW = "V";
    public static SP = "P";
    public static SQL = "SQL";
}
export class COL_DIR_TYPE {
    public static RET_VAL = "RET_VAL";      // Return value
    public static IN_PARAM = "IN_PARAM";    // Input Parameter to SP or Custom SQL
    public static OUT_PARAM = "OUT_PARAM";  // Ouput Parameter from SP
    public static RSLTSET = "RSLTSET";      // Column from Return result set
    public static TBLVW_COL = "TBLVW_COL";  // Table or View Column
}

