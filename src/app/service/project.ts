import { Injectable } from "@angular/core";
import { DataGenerator } from '../include';
import { OBJ_TYPE, COL_DIR_TYPE, OBJECT_TYPES_LIST } from "../constants";

//import { TRON_GLOBAL, TRON_EVENT } from '../constants';

export interface OutputMap {
    id: number;
    dbObjectId: number;
    instance: number;
    //sequence: number; // for layout; ideally, the outputMap will have lines pointing to columns but the number of edge crossing is minimized
    outputName: string;
    dirType: COL_DIR_TYPE;

    refCount: number;
    // Should we let the user to choose between name vs sequence nr?
    useSequence?: boolean;
}

export interface ConnectionConfig {
    serverName: string;
    databaseName: string;
    userName: string;
    password?: string
    verified: boolean;
}

export class DBObjDef {
    id: number;
    name: string;
    objType: string;
    sequence: number;
    instance: number = 1;
    selected: boolean = false;
    x: number = 0;
    y: number = 0;
    rowcount: number = 100;

    columns: { [dirType: string]: ColumnDef[] } = {}
    sql: string;
    fromStmtStartPos?: number; // the position of the word "from" in the SQL; in order to insert INTO ##tmpTbl for storing results

    public constructor(
        fields?: {
            id: number;
            name: string;
            objType: string;
            sequence?: number;
            instance?: number;
            selected?: boolean
            x?: number;
            y?: number;
            rowcount?: number;
            sql?: string;
        }) {
        this.columns[COL_DIR_TYPE.TBLVW_COL] = [];
        this.columns[COL_DIR_TYPE.IN_PARAM] = [];
        this.columns[COL_DIR_TYPE.OUT_PARAM] = [];
        this.columns[COL_DIR_TYPE.RSLTSET] = [];
        this.columns[COL_DIR_TYPE.RET_VAL] = [];
        if (fields) Object.assign(this, fields);
    }
    get isTableOrView():boolean {
        return (this.objType == OBJ_TYPE.TB || this.objType == OBJ_TYPE.VW);
    }
    get isSQL():boolean {
        return (this.objType == OBJ_TYPE.SQL);
    }
    get isSP():boolean {
        return (this.objType == OBJ_TYPE.SP);
    }
}

export class ColumnDef {
    name: string;
    dataType: string;
    charMaxLen: number = 0;
    precision: number = 0;
    scale: number = 0;
    nullable: boolean = false;
    colDefault: string = "";
    include: boolean = false;
    fkConstraintID: number;
    fkTable: string;
    fkColumn: string;
    fkSchema: string;
    isIdentity: boolean = false;
    //dirType: COLUMN_DIR_TYPE;
    plugIn: DataGenerator[] = []; // DataGenerator sometimes requires much configuration... save the change in case the user switch generator types by mistakes
    variable: string; // placeholder for SQL variable names
    x: number;   // these coordinates are for connecting lines in flow diagram
    y: number;
    dirType: COL_DIR_TYPE;
    ordinal: number;

    public get cleanName(): string {
        return this.name.replace(/[\$ #@]/g, '_');
    }
    public constructor(
        fields?: {
            name: string;
            dataType: string;
            charMaxLen?: number;
            precision?: number;
            scale?: number;
            nullable?: boolean;
            colDefault?: string;
            include?: boolean;
            fkConstraintID?: number;
            fkTable?: string;
            fkColumn?: string;
            fkSchema?: string;
            isIdentity?: boolean;
            dirType?: COL_DIR_TYPE;
            ordinal?: number;
        }) {
        this.x = 0; this.y = 0;
        if (fields) Object.assign(this, fields);
    }
}
export class ProjectStruct {
    connection: ConnectionConfig;
    filePath: string = "";
    selectedObjs: { [objType: string]: DBObjDef[] } = {};
    outputMaps: OutputMap[] = [];
    constructor() {
        this.connection = {
            serverName: 'DELL',
            databaseName: 'AdventureWorks2014',
            userName: 'sa',
            password: "LongLive1",
            verified: false
        }
        this.selectedObjs[OBJ_TYPE.TB] = [];
        this.selectedObjs[OBJ_TYPE.VW] = [];
        this.selectedObjs[OBJ_TYPE.SP] = [];
        this.selectedObjs[OBJ_TYPE.SQL] = [];
    }
}
@Injectable()
export class ProjectService {
    project: ProjectStruct = new ProjectStruct();

    getDBObjInstance(objId:number, instance:number): DBObjDef {
        let i: DBObjDef;
        i = this.selectedObjs[OBJ_TYPE.TB].find(o => o.id == objId && o.instance == instance);
        if (i) return i;
        i = this.selectedObjs[OBJ_TYPE.VW].find(o => o.id == objId && o.instance == instance);
        if (i) return i;
        i = this.selectedObjs[OBJ_TYPE.SP].find(o => o.id == objId && o.instance == instance);
        if (i) return i;
        i = this.selectedObjs[OBJ_TYPE.SQL].find(o => o.id == objId && o.instance == instance);
        if (i) return i;
        return null;
    }
    getDBObj(objId:number): DBObjDef {
        let i: DBObjDef;
        i = this.selectedObjs[OBJ_TYPE.TB].find(o => o.id == objId);
        if (i) return i;
        i = this.selectedObjs[OBJ_TYPE.VW].find(o => o.id == objId);
        if (i) return i;
        i = this.selectedObjs[OBJ_TYPE.SP].find(o => o.id == objId);
        if (i) return i;
        i = this.selectedObjs[OBJ_TYPE.SQL].find(o => o.id == objId);
        if (i) return i;
        return null;
    }
    getMappableTargetColumns(objId:number, instance:number): ColumnDef[] {
        let obj = this.getDBObjInstance(objId, instance);
        return obj.columns[COL_DIR_TYPE.IN_PARAM].concat(obj.columns[COL_DIR_TYPE.TBLVW_COL])
            .filter(d => {
                if (d.plugIn.length > 0 && d.plugIn[0].constructor.name == "CommandOutputGenerator")
                    return true;
                return false;
            });
    }
    // find all the columns of an object that have been used for mapping (output). We need this list to draw the rect and connect the line.
    // I don't intend to draw every columns even if they don't participate in mapping
    getMappedSourceColumns(objId:number, instance:number): ColumnDef[] {
        let colArr:ColumnDef[] = [];
        for (let o of this.project.outputMaps) {
            if (o.dbObjectId == objId && o.instance == instance) {
                let dbObj = this.getDBObjInstance(objId, instance);
                colArr.push(dbObj.columns[o.dirType.toString()].find(c => c.dirType == o.dirType && c.name == o.outputName));
            }
        }
        return colArr;
    }
    getMappableSourceColumns(objId:number, instance:number): ColumnDef[] {
        let obj = this.getDBObjInstance(objId, instance);
        return obj.columns[COL_DIR_TYPE.RSLTSET].concat(obj.columns[COL_DIR_TYPE.TBLVW_COL]).concat(obj.columns[COL_DIR_TYPE.OUT_PARAM]).concat(obj.columns[COL_DIR_TYPE.RET_VAL]).concat(obj.columns[COL_DIR_TYPE.IN_PARAM]);
    }
    getAllColumns(objId:number, instance:number): ColumnDef[] {
        let obj = this.getDBObjInstance(objId, instance);
        return obj.columns[COL_DIR_TYPE.IN_PARAM]
            .concat(obj.columns[COL_DIR_TYPE.TBLVW_COL])
            .concat(obj.columns[COL_DIR_TYPE.OUT_PARAM])
            .concat(obj.columns[COL_DIR_TYPE.RSLTSET]);
    }
    getAllObjects():DBObjDef[] {
        var allObj:DBObjDef[] = [];
        for (let objType of OBJECT_TYPES_LIST) {
            allObj = allObj.concat(this.selectedObjs[objType]);
        }
        return allObj;
    }
    createNewProject() {
        this.project = new ProjectStruct();
    }
    get connection(): ConnectionConfig {
        return this.project.connection;
    }
    get selectedObjs(): { [objType: string]: DBObjDef[] } {
        return this.project.selectedObjs;
    }
    set selectedObjs(val) {
        this.project.selectedObjs = val;
    }
    get outputMaps(): OutputMap[] {
        return this.project.outputMaps;
    }
    get serverName(): string {
        return this.project.connection.serverName;
    }
    get databaseName(): string {
        return this.project.connection.databaseName;
    }
    get userName(): string {
        return this.project.connection.userName;
    }
    get password(): string {
        return this.project.connection.password;
    }
    set serverName(val: string) {
        if (val !== this.project.connection.serverName) {
            this.project.connection.serverName = val;
            this.project.connection.verified = false;
        }
    }
    set databaseName(val: string) {
        if (val !== this.project.connection.databaseName) {
            this.project.connection.databaseName = val;
            this.project.connection.verified = false;
        }
    }
    set userName(val: string) {
        if (val !== this.project.connection.userName) {
            this.project.connection.userName = val;
            this.project.connection.verified = false;
        }
    }
    set password(val: string) {
        if (val !== this.project.connection.password) {
            this.project.connection.password = val;
            this.project.connection.verified = false;
        }
    }
}