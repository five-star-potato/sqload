//import { TRON_GLOBAL, TRON_EVENT, NAME_TYPE, OBJ_TYPE, COL_DIR_TYPE } from '../constants';
import { fnGetDataTypeDesc, fnStringifyNoCircular, fnGetCleanName, WorkerMessage } from '../include';
import { ProjectStruct, DBObjDef, DbObjIdentifier, OutputMap, ColumnDef } from '../project-def';
import { NAME_TYPE, WORKER_MSG_TYPE, OBJ_TYPE, COL_DIR_TYPE } from "../constants";
import { SampleAddressGenerator, GivenNameGenerator, SurnameGenerator, IntegerGenerator, TextGenerator, DateGenerator, UUIDGenerator, CustomSqlGenerator, CustomValueGenerator, FKGenerator } from '../generator/generators.component';
declare var require: (moduleId: string) => any;
var appConf = require('../../app.conf');

class RendererEngine {
    sampleAdresses = {}; // the assoc array will be { key:  region-country }, values:[] }
    sampleNames = {};

    constructor(public project: ProjectStruct) { }
    loadSampleAddresses() {
        var xhttp = new XMLHttpRequest();
        for (let s in this.sampleAdresses) {
            if (this.sampleAdresses[s].length == 0) { // only get addresses when empty
                let key: string[] = s.split('-');
                let url = `${appConf.dataService.url}/address?region=${key[0]}&country=${key[1]}&rc=10000`;
                xhttp.open("GET", url, false);
                xhttp.send();
                console.log(xhttp.responseText);
                //this.sampleAdresses[s] = ;
            }
        }
    }

    checkNeedForSampleData() {
        let needNames: boolean;
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
                            needNames = true;
                        }
                    }
                }
            });
        });
    }
}

onmessage = function (event) {
    console.log("worker.js: event is");
    let msg: WorkerMessage = event.data as WorkerMessage;
    switch (msg.msgType) {
        case WORKER_MSG_TYPE.RENDER:
            let proj = (msg.data as ProjectStruct);
            let renderer: RendererEngine = new RendererEngine(proj);
            renderer.checkNeedForSampleData();
            console.log(proj);
            break;
    }
    /*
    for (let obj of proj.selectedObjs['SQL']) {
        for (let i = 0; i < 10000; i++) {
            let j = Math.pow(i, 2);
            console.log(j);
        }
        (<any>postMessage)({cleaned: fnGetCleanName(obj.name)});
    }
    */
};
