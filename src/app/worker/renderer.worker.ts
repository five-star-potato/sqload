//import { TRON_GLOBAL, TRON_EVENT, NAME_TYPE, OBJ_TYPE, COL_DIR_TYPE } from '../constants';
import { fnGetDataTypeDesc, fnStringifyNoCircular, fnGetCleanName, WorkerMessage, fnGetLargeRandomNumber } from '../include';
import { ProjectStruct, DBObjDef, DbObjIdentifier, OutputMap, ColumnDef, GroupDef, Address, PersonName } from '../project-def';
import { NAME_TYPE, WORKER_MSG_TYPE, OBJ_TYPE, COL_DIR_TYPE } from "../constants";
import { SampleAddressGenerator, GivenNameGenerator, SurnameGenerator, IntegerGenerator, TextGenerator, DateGenerator, UUIDGenerator, CustomSqlGenerator, CustomValueGenerator, FKGenerator } from '../generator/generators.component';
declare var require: (moduleId: string) => any;
var appConf = require('../../app.conf');

class RendererEngine {
    sampleAdresses = {}; // the assoc array will be { key:  region-country }, values:[] }
    sampleNames = {};
    totalRowCnt: number = 0;

    constructor(public project: ProjectStruct) { }
    private substituteAddressField(field: string, addr: any, isSQL:boolean): string {
        var tmp: string = field;
        tmp = field.replace('@id', "'" + addr.id + "'")
            .replace('@lat', "'" + (addr.lat || '0') + "'")
            .replace('@lon', "'" + (addr.lon || '0') + "'")
            .replace('@num', "'" + (addr.num || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@unit', "'" + (addr.unit || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@street', "'" + (addr.street || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@city', "'" + (addr.city || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@region', "'" + (addr.region || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@district', "'" + (addr.district || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@country', "'" + (addr.country || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@postcode', "'" + (addr.postcode || '').replace("'", isSQL ? "''" : "'") + "'");
        return `${tmp}`;
    }

    private generateDataForRow(colArr: ColumnDef[], fkConstraints: Set<number>, colNames: string[], variables: string[], obj: DBObjDef, objIndex: number) {
        let vals: string[] = [];
        let k = 0;
        let incr: number = appConf.options.sqlFileMaxInserts;
        // Don't "setTimeout" every row. How about every XXX rows. Does it improve performance?
        while (k < obj.rowcount) {
            let addressData: any = null;
            for (let cf of colArr) {
                if (cf.include) {
                    if (cf.plugIn[0] instanceof CustomSqlGenerator) {
                        let tmpTbl = cf.variable.replace('@', '@T_');
                        vals.push(`INSERT INTO ${tmpTbl}(value) EXEC(N'`);
                        vals.push(cf.plugIn[0].generate());
                        vals.push(`');\nSELECT TOP 1 ${cf.variable} = value FROM ${tmpTbl};\nDELETE ${tmpTbl};`);
                    }
                    // getting data from pre-loaded sample addresses
                    else if (cf.plugIn[0] instanceof SampleAddressGenerator) {
                        let expandedField: string, addrVal: string;
                        try {
                            let ag: SampleAddressGenerator = (cf.plugIn[0] as SampleAddressGenerator);
                            if (!addressData) {
                                if (this.sampleAdresses[ag.key].length == 0) {
                                    console.log("no more addresses");
                                    this.loadSampleAddresses();
                                }
                                addressData = this.sampleAdresses[ag.key].pop();
                            }
                            if (ag.scriptType == "SQL") {
                                expandedField = this.substituteAddressField(ag.fieldSpec, addressData, true);
                                vals.push(`SELECT ${cf.variable} = ${expandedField};`);
                            }
                            else { // assuming it's JS
                                expandedField = this.substituteAddressField(ag.fieldSpec, addressData, false);
                                addrVal = eval(expandedField);
                                vals.push(`SELECT ${cf.variable} = '${addrVal}';`);
                            }
                        }
                        catch (err) {
                            console.log(expandedField + "-" + err);
                        }
                    }
                    else if (cf.plugIn[0] instanceof GivenNameGenerator) {
                        if (this.sampleNames[NAME_TYPE.FN].length == 0) {
                            console.log("no more given names");
                            this.loadSampleNames();
                        }
                        let givenName: PersonName = this.sampleNames[NAME_TYPE.FN].pop();
                        vals.push(`SET ${cf.variable} = '${givenName.name}';`);
                    }
                    else if (cf.plugIn[0] instanceof SurnameGenerator) {
                        if (this.sampleNames[NAME_TYPE.LN].length == 0) {
                            console.log("no more given names");
                            this.loadSampleNames();
                            
                        let surname: PersonName = this.sampleNames[NAME_TYPE.LN].pop();
                        vals.push(`SET ${cf.variable} = '${surname.name}';`);
                    }
                    else if (!cf.fkConstraintID) {
                        vals.push(`SET ${cf.variable} = '${cf.plugIn[0].generate()}';`);
                    }
                }
            }

            // Processing all the FK constraints per row
            let fkSql: string = "";
            if (fkConstraints.size > 0) {
                // processing FK assignments
                fkSql = "SELECT TOP 1 ";
                fkConstraints.forEach((constraintId) => {
                    let refTable: string;
                    let colAssign: string[] = [];
                    colArr.forEach((cf: ColumnDef) => {
                        if (cf.fkConstraintID == constraintId) {
                            refTable = `${cf.fkSchema}.${cf.fkTable}`;
                            // can't correlate to "variables"" ...
                            colAssign.push(`@${objIndex}$${cf.name} = ${cf.fkColumn}`);
                        }
                    });
                    fkSql += colAssign.join();
                    fkSql += ` FROM ${refTable} ORDER BY NEWID();\n`;
                });
            }
            let str: string = "";
            str += vals.join('\n') + '\n';
            str += fkSql;
            if (obj.isTableOrView)
                str += `INSERT INTO ${obj.name}(${colNames.join()}) VALUES(${variables.join()});`;
            else if (obj.objType == OBJ_TYPE.SP) {
                str += `EXEC ${obj.name} ${variables.join()};`;
            }
            else if (obj.objType == OBJ_TYPE.SQL) {
                // just assume all @vars are nvarchar(max) for now
                let declareParams:string = colArr.map(c => c.name).join(" nvarchar(max), ") + " nvarchar(max)";
                str += "EXEC sp_executesql N'" + obj.sql.replace("'","''") + "',N'" + declareParams + "'," + variables.join();
            }
            //console.log(str);
            this.stmts.push(str);
            vals.length = 0;
            k++;
        }
        rowCnt += k;
        this.runningRowCnt += k;
        objProgress.percent = Math.round(rowCnt * 100 / obj.rowcount);
        if (rowCnt < obj.rowcount) {
            this.overallProgress = Math.ceil(this.runningRowCnt * 100 / this.totalRowCnt);
            console.log("overall progress: " + this.overallProgress.toString());
            this.fnWriteSqlToFile(this.fileSubDir, this.projectService.connection, fnGetCleanName(obj.name), rowCnt, [...this.declareStmts, ...this.stmts]);
            this.stmts = [];
            setTimeout(this.generateDataForRow.bind(this, colArr, fkConstraints, colNames, variables, obj, objProgress, objIndex, rowCnt), 100);
        }
        else {
            objIndex++;
            if (objIndex < this.allObjects.length) {
                setTimeout(this.generateDataForObj.bind(this, objIndex), 50);
            }
            else {
                this.overallProgress = 100;
                this.fnWriteSqlToFile(this.fileSubDir, this.projectService.connection, fnGetCleanName(obj.name), rowCnt, [...this.declareStmts, ...this.stmts]);
                this.stmts = [];
                this.wizardStateService.hideSpinning();
            }
        }
    }   
    private generateDeclareVars(colArr: ColumnDef[], variables, objIndex: number):string[] {
        let declareStmts: string[] = [];
        // generate declare varialbles
        for (let cf of colArr) {
            if (cf.include) {
                let varRoot = `${fnGetCleanName(cf.name)}`;
                cf.variable = `@${objIndex}$` + varRoot;
                declareStmts.push(`DECLARE ${cf.variable} ${fnGetDataTypeDesc(cf)};`);
                declareStmts.push(`DECLARE @T_${objIndex}$${varRoot} TABLE ( value ${fnGetDataTypeDesc(cf)} );`); // not all columns need this; so far only the ones that use CustomSqlGenerator needs it
                variables.push(cf.variable);
            }
        }
        return declareStmts;
    }
    private generateDataForObj(obj:DBObjDef, index: number) {
        let fkConstraints: Set<number> = new Set<number>();
        let colNames: string[] = [];
        let variables: string[] = [];

        let colArr: ColumnDef[];
        if (obj.isTableOrView)
            colArr = obj.columns[COL_DIR_TYPE.TBLVW_COL];
        else
            colArr = obj.columns[COL_DIR_TYPE.IN_PARAM];
        for (let cf of colArr) {
            if (cf.include) {
                colNames.push(`[${cf.name}]`);
                if (cf.plugIn.length == 0 && !cf.fkConstraintID) {
                    (<any>postMessage)(new WorkerMessage({msgType: WORKER_MSG_TYPE.RENDER_ERR, data: "Missing plugin and FK: " + cf.name}));
                    console.log("Missing plugin and FK: " + cf.name);
                }
                else if (cf.plugIn.length > 0) {
                    // FK generation is different from other generator
                    if (cf.plugIn[0] instanceof FKGenerator) {
                        if (cf.fkConstraintID > 0) {
                            // get the unique set of fk constraints; sometimes FK can have multiple columns. These columns must be set to point to the same entry in the referenced table
                            fkConstraints.add(cf.fkConstraintID);
                        }
                    }
                }
            }
        }
        // generate declare vars
        let declareStmts = this.generateDeclareVars(colArr, variables, index);
        (<any>postMessage)(new WorkerMessage({msgType: WORKER_MSG_TYPE.OUTPUT, data: { name: obj.name, rows: "", stmts: declareStmts }}));
        // generate [rowcount] number INSERTS for each table
        this.generateDataForRow(colArr, fkConstraints, colNames, variables, obj, index);
    }
    loadSampleAddresses() {
        var xhttp = new XMLHttpRequest();
        for (let s in this.sampleAdresses) {
            if (this.sampleAdresses[s].length == 0) { // only get addresses when empty
                let key: string[] = s.split('-');
                let url = `${appConf.dataService.url}/address?region=${key[0]}&country=${key[1]}&rc=10000`;
                (<any>postMessage)(new WorkerMessage({msgType: WORKER_MSG_TYPE.GET_SAMPLE_DATA_START}));
                xhttp.open("GET", url, false);
                xhttp.send();
                this.sampleAdresses[s] = JSON.parse(xhttp.responseText);
                //console.log(this.sampleAdresses[s][0]);
                (<any>postMessage)(new WorkerMessage({msgType: WORKER_MSG_TYPE.GET_SAMPLE_DATA_END}));            }
        }
    }
    loadSampleNames() {
        var xhttp = new XMLHttpRequest();
        for (let k of [NAME_TYPE.FN, NAME_TYPE.LN]) {
            if (this.sampleNames[k] && this.sampleNames[k].length == 0) {
                let url = `${appConf.dataService.url}/name?nameType=${k}&rc=1000`;
                (<any>postMessage)(new WorkerMessage({msgType: WORKER_MSG_TYPE.GET_SAMPLE_DATA_START}));
                xhttp.open("GET", url, false);
                xhttp.send();
                this.sampleNames[k] = JSON.parse(xhttp.responseText);
                //console.log(this.sampleNames[s][0]);
                (<any>postMessage)(new WorkerMessage({msgType: WORKER_MSG_TYPE.GET_SAMPLE_DATA_END}));            
            }
        }
    }
    checkNeedForSampleData() {
        console.log("Worker: checkNeedForSample");
        let allObjs: DBObjDef[] = this.project.selectedObjs[OBJ_TYPE.TB].concat(this.project.selectedObjs[OBJ_TYPE.VW]).concat(this.project.selectedObjs[OBJ_TYPE.SQL]).concat(this.project.selectedObjs[OBJ_TYPE.SP]);
        allObjs.forEach(t => {
            console.log(t.name);
            let colArr: ColumnDef[] = t.columns[COL_DIR_TYPE.IN_PARAM].concat(t.columns[COL_DIR_TYPE.OUT_PARAM]).concat(t.columns[COL_DIR_TYPE.TBLVW_COL]).concat(t.columns[COL_DIR_TYPE.RSLTSET]).concat(t.columns[COL_DIR_TYPE.RET_VAL]);
            colArr.forEach((cf: ColumnDef) => {
                if (cf.include) {
                    if (cf.plugIn.length > 0) {
                        // FK generation is different from other generator
                        if (cf.plugIn[0] instanceof SampleAddressGenerator) {
                            let sg: SampleAddressGenerator = cf.plugIn[0] as SampleAddressGenerator;
                            if (!(sg.key in this.sampleAdresses)) {
                                this.sampleAdresses[sg.key] = [];
                            }
                        }
                        if (cf.plugIn[0] instanceof GivenNameGenerator || cf.plugIn[0] instanceof SurnameGenerator) {
                            this.sampleNames[NAME_TYPE.FN] = [];
                            this.sampleNames[NAME_TYPE.LN] = [];
                        }
                    }
                }
            });
        });
    }
    generateData() {
        this.project.getAllObjects().forEach(t => {
            if (t.groupId) {
                let group:GroupDef = this.project.groups.find(g => g.id == t.groupId);
                let objId:DbObjIdentifier = group.members[0];
                let dbObj:DBObjDef = this.project.getDBObjInstance(objId.dbObjectId, objId.instance);
                this.totalRowCnt += dbObj.rowcount;
            }
            else {
                this.totalRowCnt += t.rowcount;
            }
        });
        let allObjs: DBObjDef[] = this.project.getAllObjects();
        for (let i = 0; i < allObjs.length; i++) {
            this.generateDataForObj(allObjs[i], i);
        }
    }
}

onmessage = function (event) {
    console.log("worker.js: event is");
    console.log(event);
    let msg: WorkerMessage = event.data as WorkerMessage;
    switch (msg.msgType) {
        case WORKER_MSG_TYPE.RENDER:
            let proj:ProjectStruct = new ProjectStruct().deserialize(msg.data);
            let renderer: RendererEngine = new RendererEngine(proj);
            renderer.checkNeedForSampleData();
            renderer.loadSampleAddresses();
            renderer.loadSampleNames();
            renderer.generateData();

            console.log(proj);
            break;
    }
};
