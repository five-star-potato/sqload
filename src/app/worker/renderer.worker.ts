//import { TRON_GLOBAL, TRON_EVENT, NAME_TYPE, OBJ_TYPE, COL_DIR_TYPE } from '../constants';
import { fnGetDataTypeDesc, fnStringifyNoCircular, fnGetCleanName, WorkerMessage, fnGetLargeRandomNumber } from '../include';
import { ProjectStruct, DBObjDef, DbObjIdentifier, OutputMap, ColumnDef, GroupDef } from '../project-def';
import { NAME_TYPE, WORKER_MSG_TYPE, OBJ_TYPE, COL_DIR_TYPE } from "../constants";
import { SampleAddressGenerator, GivenNameGenerator, SurnameGenerator, IntegerGenerator, TextGenerator, DateGenerator, UUIDGenerator, CustomSqlGenerator, CustomValueGenerator, FKGenerator } from '../generator/generators.component';
declare var require: (moduleId: string) => any;
var appConf = require('../../app.conf');

class RendererEngine {
    sampleAdresses = {}; // the assoc array will be { key:  region-country }, values:[] }
    sampleNames = {};
    totalRowCnt: number = 0;

    constructor(public project: ProjectStruct) { }

    private generateDeclareVars(colArr: ColumnDef[], objIndex: number):string[] {
        let declareStmts: string[] = [];

        // generate declare varialbles
        for (let cf of colArr) {
            if (cf.include) {
                let varRoot = `${fnGetCleanName(cf.name)}`;
                cf.variable = `@${objIndex}$` + varRoot;
                declareStmts.push(`DECLARE ${cf.variable} ${fnGetDataTypeDesc(cf)};`);
                declareStmts.push(`DECLARE @T_${objIndex}$${varRoot} TABLE ( value ${fnGetDataTypeDesc(cf)} );`); // not all columns need this; so far only the ones that use CustomSqlGenerator needs it
            }
        }
        return declareStmts;
    }
   
    private generateDataForObj(obj:DBObjDef, index: number) {
        let fkConstraints: Set<number> = new Set<number>();
        let colArr: ColumnDef[];
        if (obj.isTableOrView)
            colArr = obj.columns[COL_DIR_TYPE.TBLVW_COL];
        else
            colArr = obj.columns[COL_DIR_TYPE.IN_PARAM];
        let variables: string[] = [];

        for (let cf of colArr) {
            if (cf.include) {
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
        let declareStmts = this.generateDeclareVars(colArr, index);
        (<any>postMessage)(new WorkerMessage({msgType: WORKER_MSG_TYPE.OUTPUT, data: { name: obj.name, rows: "", stmts: declareStmts }}));
        // generate [rowcount] number INSERTS for each table
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
            if (this.sampleNames[k].length == 0) {
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

            console.log(proj);
            break;
    }
};
