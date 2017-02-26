import { Injectable } from "@angular/core";
import { fnGetLargeRandomNumber, fnGetCleanName } from '../include';
import { CommandOutputGenerator  } from '../generator/generators.component';
import { OBJ_TYPE, COL_DIR_TYPE, OBJECT_TYPES_LIST } from "../constants";
import { ConnectionConfig, DbObjIdentifier, ColumnDef, DBObjDef, GroupDef, OutputMap, ProjectStruct } from "../project-def";

// Using a typeguard to check whether it's a group or dbobj
export function fnIsGroup(obj: DBObjDef | GroupDef): obj is GroupDef {
    return (<GroupDef>obj).members !== undefined;
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