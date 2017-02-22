import * as gen from '../generator/generators.component';
import { Injectable } from "@angular/core";
import { DataGenerator, fnGetLargeRandomNumber, fnStringifyNoCircular } from '../include';
import { CommandOutputGenerator  } from '../generator/generators.component';
import { OBJ_TYPE, COL_DIR_TYPE, OBJECT_TYPES_LIST } from "../constants";
declare var require:(moduleId:string) => any;
var appConf = require('../../app.conf');

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

@Injectable()
export class ProjectService {
    project: ProjectStruct = new ProjectStruct();

    getDBObjInstance(objId: number, instance: number): DBObjDef {
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
    getDBObj(objId: number): DBObjDef {
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
    getColumnByDBObjDirType(objId: number, instance: number, dirType: COL_DIR_TYPE, colName): ColumnDef {
        return this.getAllColumnsByObjIdInst(objId, instance).find(c => c.name == colName && c.dirType == dirType);
    }
    getMappableTargetColumns(objId: number, instance: number): ColumnDef[] {
        let obj = this.getDBObjInstance(objId, instance);
        let tmp = obj.columns[COL_DIR_TYPE.IN_PARAM].concat(obj.columns[COL_DIR_TYPE.TBLVW_COL])
            .filter(d => {
                if (d.plugIn.length > 0 && d.plugIn[0].constructor.name == "CommandOutputGenerator")
                    return true;
                return false;
            });
        return tmp;
    }
    // find all the columns of an object that have been used for mapping (output). We need this list to draw the rect and connect the line.
    // I don't intend to draw every columns even if they don't participate in mapping
    getMappedOutputColumns(objId: number, instance: number): ColumnDef[] {
        let colArr: ColumnDef[] = [];
        for (let o of this.project.outputMaps) {
            if (o.dbObjectId == objId && o.instance == instance) {
                let dbObj = this.getDBObjInstance(objId, instance);
                let c = dbObj.columns[o.dirType.toString()].find(c => c.dirType == o.dirType && c.name == o.outputName);
                // if this column is both mappable target and mapped output, don't return it, because in the flow diagram logic, I draw the mappable target first
                // not very nice because it's very coupled with the flow diagram logic
                if (c.plugIn.length == 0 || c.plugIn[0].constructor.name != "CommandOutputGenerator")
                    colArr.push(c);
            }
        }
        return colArr;
    }
    // to be displayed on the mapping dropdown dialog 
    getMappableOutputColumns(objId: number, instance: number): ColumnDef[] {
        let obj = this.getDBObjInstance(objId, instance);
        return obj.columns[COL_DIR_TYPE.RSLTSET].concat(obj.columns[COL_DIR_TYPE.TBLVW_COL]).concat(obj.columns[COL_DIR_TYPE.OUT_PARAM]).concat(obj.columns[COL_DIR_TYPE.RET_VAL]).concat(obj.columns[COL_DIR_TYPE.IN_PARAM]);
    }
    getAllColumnsByObjIdInst(objId: number, instance: number): ColumnDef[] {
        let obj = this.getDBObjInstance(objId, instance);
        return this.getAllColumnsByObj(obj);
    }
    getAllColumnsByObj(obj: DBObjDef): ColumnDef[] {
        return obj.columns[COL_DIR_TYPE.IN_PARAM]
            .concat(obj.columns[COL_DIR_TYPE.TBLVW_COL])
            .concat(obj.columns[COL_DIR_TYPE.OUT_PARAM])
            .concat(obj.columns[COL_DIR_TYPE.RET_VAL])
            .concat(obj.columns[COL_DIR_TYPE.RSLTSET]);
    }
    getAllObjects(): DBObjDef[] {
        var allObj: DBObjDef[] = [];
        for (let objType of OBJECT_TYPES_LIST) {
            allObj = allObj.concat(this.selectedObjs[objType]);
        }
        return allObj.sort((a, b) => a.sequence - b.sequence);
    }
    createNewProject() {
        this.project = new ProjectStruct();
    }


    // Group related functions
    reduceOutputMappingRefCount(outMap: OutputMap) {
        outMap.refCount -= 1;
        if (outMap.refCount <= 0) {
            let i = this.project.outputMaps.findIndex(m => m.id == outMap.id);
            this.project.outputMaps.splice(i, 1);
        }
    }
    private getGroup(grpOrId: number | GroupDef): GroupDef {
        let grp:GroupDef;
        if (typeof(grpOrId) == "number")
            grp = this.project.groups.find(g => g.id == grpOrId);
        else 
            grp = grpOrId;  
        return grp;
    }
    joinGroups(targetGrpOrId: number | GroupDef, srcGrpOrId: number | GroupDef) {
        let tarGrp:GroupDef = this.getGroup(targetGrpOrId);
        let srcGrp:GroupDef = this.getGroup(srcGrpOrId);
            
        // assume the last memeber in tarGrp group has the max seq #
        let seq = this.getDBObjInstance(tarGrp.members[tarGrp.members.length - 1].dbObjectId, tarGrp.members[tarGrp.members.length - 1].instance).sequence;
        for (let i = 0; i < srcGrp.members.length; i++) {
            let obj = this.getDBObjInstance(srcGrp.members[i].dbObjectId, srcGrp.members[i].instance);
            obj.groupId = tarGrp.id;
            obj.sequence = ++seq;
        }
        let newSet: DbObjIdentifier[] = [...tarGrp.members, ...srcGrp.members];
        tarGrp.members = newSet;
        // removed source groups
        let srcIndex = this.project.groups.findIndex(g => g.id == srcGrp.id);
        this.project.groups.splice(srcIndex, 1);
    }
    formGroup(target:DBObjDef, src:DBObjDef) {
        let grp:GroupDef = new GroupDef();
        grp.id = fnGetLargeRandomNumber();
        if (target.groupId || src.groupId)
            throw 'group is already defined';
        target.groupId = src.groupId = grp.id;
        // get them close enough the squeeze out others that happened to be in between
        target.sequence = src.sequence + 1;
        grp.members.push(new DbObjIdentifier({dbObjectId: src.id, instance: src.instance}));
        grp.members.push(new DbObjIdentifier({dbObjectId: target.id, instance: target.instance}));

        this.project.groups.push(grp);
        this.resequenceDbObjs();
    }
    resequenceDbObjs() {
        // the purpose of resequencing is to put "gaps" between db objects so that dragging and dropping can be easily done by setting a new sequence number in between gaps
        let seqNr:number = 0;
        let dbObjs:DBObjDef[] = this.getAllObjects();
        dbObjs.sort((a,b) => (a.sequence - b.sequence));
        for (let o of dbObjs){
            o.sequence = (seqNr += 1000);
        }
    }
    ungroup(grp:GroupDef) {
        this.forEachGroupMember(grp, a => {
            a.groupId = undefined;
        });
        let grpIndex = this.project.groups.findIndex(g => g.id == grp.id);
        this.project.groups.splice(grpIndex, 1);
    }
    joinDbObjToGroup(dbObj:DBObjDef, grp:GroupDef) {
        let maxSeq = Math.max.apply(Math, grp.members.map(m => {
            let o = this.getDBObjInstance(m.dbObjectId, m.instance);
            return o.sequence;
        }));
        dbObj.sequence = maxSeq + 1;
        dbObj.groupId = grp.id;
        grp.members.push(new DbObjIdentifier({ dbObjectId: dbObj.id, instance: dbObj.instance }));
        this.resequenceDbObjs();
    }
    // find the bottom (max) or top (min) objects within a group
    findEdgeObjInGroup(grpId: number, minmax: string = "min"):DBObjDef {
        let grp:GroupDef = this.project.groups.find(g => g.id == grpId);
        let dbObj:DBObjDef;
        this.forEachGroupMember(grp, a => {
            if (dbObj) {
                if (minmax == "min") {
                    if (a.sequence < dbObj.sequence)
                        dbObj = a;
                }
                else { //max
                    if (a.sequence > dbObj.sequence)
                        dbObj = a;
                }
            }
            else 
                dbObj = a;
        });
        return dbObj;
    }
    public sortGroupMember(grpOrId: number | GroupDef) {
        let dbObjs:DBObjDef[] = [];
        let grp:GroupDef = this.getGroup(grpOrId);
        for (let objId of grp.members) {
            let a:DBObjDef = this.getDBObjInstance(objId.dbObjectId, objId.instance);
            dbObjs.push(a);
        }
        dbObjs.sort((a,b) => (a.sequence - b.sequence));
        grp.members = dbObjs.map(o => new DbObjIdentifier({dbObjectId: o.id, instance: o.instance}));
    }
    public forEachGroupMember(grp:GroupDef, callback: (o:DBObjDef) => any):void {
        for (let objId of grp.members) {
            let a:DBObjDef = this.getDBObjInstance(objId.dbObjectId, objId.instance);
            callback(a);
        }
    }
    public isFirstObjInGroup(obj:DBObjDef) {
        if (!obj.groupId) return false;

        let grp = this.project.groups.find(g => g.id == obj.groupId);
        let a:DBObjDef = this.getDBObjInstance(grp.members[0].dbObjectId, grp.members[0].instance);
        return (obj == a);
    }
    public duplicateObj(obj: DBObjDef):DBObjDef {
        let newObj = new DBObjDef().deserialize(obj);
        let objs = this.getAllObjects().filter(o => o.id == obj.id);
        let maxInst = Math.max.apply(Math, objs.map(o => o.instance));
        
        newObj.instance = maxInst + 1;
        newObj.sequence = Number.MAX_VALUE;
        this.project.selectedObjs[obj.objType].push(newObj);
        let allCols = this.getAllColumnsByObj(newObj);
        allCols.forEach(c => {
            c.instance = newObj.instance; // is this poor design to duplicate the obj instance in the column level?
            if (c.plugIn.length > 0 && c.plugIn[0].constructor.name == "CommandOutputGenerator") {
                let cmdGen:CommandOutputGenerator = (c.plugIn[0] as CommandOutputGenerator);
                cmdGen.outputMappingId = null;
            }
        });
        this.resequenceDbObjs();
        return newObj;
    }
    public duplicateGroup(grpOrId: number | GroupDef):GroupDef {
        let grp:GroupDef = this.getGroup(grpOrId);
        let newGrp = new GroupDef().deserialize(grp);
        newGrp.id = fnGetLargeRandomNumber();
        newGrp.members = [];
        for (let objId of grp.members) {
            let obj = this.getDBObjInstance(objId.dbObjectId, objId.instance);
            let newObj = this.duplicateObj(obj);
            newObj.groupId = newGrp.id;
            newGrp.members.push(new DbObjIdentifier({ dbObjectId: newObj.id, instance: newObj.instance }));
        }
        this.project.groups.push(newGrp);
        //this.resequenceDbObjs();
        return newGrp;
    }
    public deleteObj(obj:DBObjDef) {
        // Assume it is not in a group
        let index = this.project.selectedObjs[obj.objType].findIndex(o => o.id == obj.id && o.instance == obj.instance);
        let cols = this.getAllColumnsByObj(obj);
        cols.forEach(c => {
            // remove outputmapping if any
            if (c.plugIn.length > 0 && c.plugIn[0].constructor.name == "CommandOutputGenerator") {
                let cmdGen = (c.plugIn[0] as CommandOutputGenerator);
                if (cmdGen.outputMappingId) {
                    let outMap = this.project.outputMaps.find(o => o.id == cmdGen.outputMappingId);
                    this.reduceOutputMappingRefCount(outMap);
                }
            }
        });
        this.project.selectedObjs[obj.objType].splice(index, 1);
    }
    public deleteGroup(grpOrId: number | GroupDef) {
        let grp:GroupDef = this.getGroup(grpOrId);
        for (let objId of grp.members) {
            let a:DBObjDef = this.getDBObjInstance(objId.dbObjectId, objId.instance);
            this.deleteObj(a);
        }
        let index = this.project.groups.findIndex(g => g.id == grp.id);
        this.project.groups.splice(index, 1);
    }


    // Properties
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
    get groups(): GroupDef[] {
        return this.project.groups;
    }
    get serverName(): string {
        return this.project.connection.serverName;
    }
    get instanceName(): string {
        return this.project.connection.instanceName;
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
    set instanceName(val: string) {
        if (val !== this.project.connection.instanceName) {
            this.project.connection.instanceName = val;
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