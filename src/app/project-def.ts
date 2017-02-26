import { OBJ_TYPE, COL_DIR_TYPE, OBJECT_TYPES_LIST } from "./constants";
import { DataGenerator } from './include';
import * as gen from './generator/generators.component';

declare var require:(moduleId:string) => any;
var appConf = require('../app.conf');

//import { TRON_GLOBAL, TRON_EVENT } from '../constants';
interface Serializable<T> {
    deserialize(input: Object): T;
}

export class DbObjIdentifier implements Serializable<DbObjIdentifier> {
    dbObjectId: number;
    instance: number;
    public deserialize(input) {
        this.dbObjectId = input.dbObjectId;
        this.instance = input.instance;
        return this;
    }
    public constructor(
        fields?: {
            dbObjectId: number;
            instance: number;
        }) {
        if (fields) Object.assign(this, fields);
    }
}
export class OutputMap implements Serializable<OutputMap> {
    id: number;
    dbObjectId: number;
    instance: number;
    //sequence: number; // for layout; ideally, the outputMap will have lines pointing to columns but the number of edge crossing is minimized
    outputName: string;
    dirType: COL_DIR_TYPE;
    refCount: number;
    // Should we let the user to choose between name vs sequence nr?
    useSequence?: boolean;

    public deserialize(input) {
        this.id = input.id;
        this.dbObjectId = input.dbObjectId;
        this.instance = input.instance;
        this.outputName = input.outputName;
        this.dirType = input.dirType;
        this.refCount = input.refCount;
        this.useSequence = input.useSequence;
        return this;
    }
    public constructor(
        fields?: {
            id: number;
            dbObjectId: number;
            instance: number;
            outputName: string;
            dirType: COL_DIR_TYPE;
            refCount: number;
        }) {
        if (fields) Object.assign(this, fields);
    }
}

export class ConnectionConfig implements Serializable<ConnectionConfig> {
    serverName: string;
    databaseName: string;
    instanceName: string;
    userName: string;
    password?: string
    verified: boolean;

    public deserialize(input) {
        this.serverName = input.serverName;
        this.databaseName = input.databaseName;
        this.instanceName = input.instanceName;
        this.userName = input.userName;
        this.password = input.password;
        this.verified = input.verified;
        return this;
    }
    public constructor(
        fields?: {
            serverName: string;
            databaseName: string;
            instanceName: string;
            userName: string;
            password: string
            verified: boolean;
        }) {
        if (fields) Object.assign(this, fields);
    }
}

export class DBObjDef implements Serializable<DBObjDef> {
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
    isDrag: boolean = false;
    groupId: number;

    public deserialize(input) {
        this.id = input.id;
        this.name = input.name;
        this.objType = input.objType;
        this.sequence = input.sequence;
        this.instance = input.instance;
        this.selected = input.selected;
        this.x = input.x;
        this.y = input.y;
        this.rowcount = input.rowcount;
        this.sql = input.sql;
        this.groupId = input.groupId;
        this.fromStmtStartPos = input.fromStmtStartPos;
        this.columns[COL_DIR_TYPE.TBLVW_COL] = [];
        this.columns[COL_DIR_TYPE.IN_PARAM] = [];
        this.columns[COL_DIR_TYPE.OUT_PARAM] = [];
        this.columns[COL_DIR_TYPE.RSLTSET] = [];
        this.columns[COL_DIR_TYPE.RET_VAL] = [];

        for (let dt of [COL_DIR_TYPE.TBLVW_COL, COL_DIR_TYPE.IN_PARAM, COL_DIR_TYPE.OUT_PARAM, COL_DIR_TYPE.RSLTSET, COL_DIR_TYPE.RET_VAL]) {
            input.columns[dt].forEach(c => {
                let colDef: ColumnDef = new ColumnDef().deserialize(c);
                this.columns[dt].push(colDef);
            });
        }
        return this;
    }
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
            groupId?: number;
        }) {
        this.columns[COL_DIR_TYPE.TBLVW_COL] = [];
        this.columns[COL_DIR_TYPE.IN_PARAM] = [];
        this.columns[COL_DIR_TYPE.OUT_PARAM] = [];
        this.columns[COL_DIR_TYPE.RSLTSET] = [];
        this.columns[COL_DIR_TYPE.RET_VAL] = [];
        if (fields) Object.assign(this, fields);
    }
    isTableOrView(): boolean {
        return (this.objType == OBJ_TYPE.TB || this.objType == OBJ_TYPE.VW);
    }
    isSQL(): boolean {
        return (this.objType == OBJ_TYPE.SQL);
    }
    isSP(): boolean {
        return (this.objType == OBJ_TYPE.SP);
    }
}

export class GroupDef implements Serializable<GroupDef> {
    id: number;
    members: DbObjIdentifier[] = []; // trouble serializing set
    x: number = 0;
    y: number = 0;
    width: number = 0;
    height: number = 0;
    isDrag: boolean = false;

    public deserialize(input) {
        this.id = input.id;
        if (input.members) {
             input.members.forEach(m => {
                 this.members.push(new DbObjIdentifier().deserialize(m));
             })
        }
        return this;
    }
    //toSortedArray() {
    //    return [...this.members].sort(m => m.sequence);
    //}
}

export class ColumnDef implements Serializable<ColumnDef> {
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
    dirType: COL_DIR_TYPE;
    ordinal: number;
    dbObjId: number;    // I don't know how to get around without duplicating the parent's field when coding in D3
    instance: number;   // db obj instance

    x: number;   // these coordinates are for connecting lines in flow diagram
    y: number;
    width: number;
    height: number;

    public deserialize(input) {
        this.name = input.name;
        this.dataType = input.dataType;
        this.charMaxLen = input.charMaxLen;
        this.precision = input.precision;
        this.scale = input.scale;
        this.nullable = input.nullable;
        this.colDefault = input.colDefault;
        this.include = input.include;
        this.fkConstraintID = input.fkConstraintID;
        this.fkTable = input.fkTable;
        this.fkColumn = input.fkColumn;
        this.fkSchema = input.fkSchema;
        this.isIdentity = input.isIdentity;
        this.variable = input.variable;
        this.dirType = input.dirType;
        this.ordinal = input.ordinal;
        this.x = input.x;
        this.y = input.y;
        this.width = input.width;
        this.height = input.height;
        this.dbObjId = input.dbObjId;
        this.instance = input.instance;
        this.plugIn = [];
        input.plugIn.forEach(obj => {
            let realPlug: any = new gen[obj.__name__](); // all the components within the module "gen" is accessible through [] indexer.
            // Object.assign can't seem to handle string to date conversion
            Object.assign(realPlug, obj);
            this.plugIn.push(realPlug);
        });
        return this;
    }
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
            dbObjId: number;
        }) {
        this.x = 0; this.y = 0;
        this.instance = 1;
        if (fields) Object.assign(this, fields);
    }
}
export class ProjectStruct implements Serializable<ProjectStruct> {
    connection: ConnectionConfig;
    filePath: string = "";
    selectedObjs: { [objType: string]: DBObjDef[] } = {};
    outputMaps: OutputMap[] = [];
    groups: GroupDef[] = [];

    public deserialize(input) {
        this.connection = new ConnectionConfig().deserialize(input.connection);
        this.filePath = input.filePath;
        for (let ot of [OBJ_TYPE.TB, OBJ_TYPE.VW, OBJ_TYPE.SP, OBJ_TYPE.SQL]) {
            input.selectedObjs[ot].forEach(o => {
                let dbObj: DBObjDef = new DBObjDef().deserialize(o);
                this.selectedObjs[ot].push(dbObj);
            });
        }
        if (input.outputMaps) {
            input.outputMaps.forEach(m => {
                this.outputMaps.push(new OutputMap().deserialize(m));
            });
        }
        if (input.groups) {
            input.groups.forEach(g => {
                this.groups.push(new GroupDef().deserialize(g));
            });
        }
        return this;
    }
    constructor() {
        this.connection = new ConnectionConfig({
            serverName: appConf.database.serverName,
            instanceName: appConf.database.instanceName,
            databaseName: appConf.database.databaseName,
            userName: appConf.database.userName,
            password: appConf.database.password,
            verified: false
        });
        this.selectedObjs[OBJ_TYPE.TB] = [];
        this.selectedObjs[OBJ_TYPE.VW] = [];
        this.selectedObjs[OBJ_TYPE.SP] = [];
        this.selectedObjs[OBJ_TYPE.SQL] = [];
    }
}
