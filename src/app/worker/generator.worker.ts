//import { TRON_GLOBAL, TRON_EVENT, NAME_TYPE, OBJ_TYPE, COL_DIR_TYPE } from '../constants';
import { fnGetDataTypeDesc, fnStringifyNoCircular, fnGetCleanName } from '../include';
import { ProjectStruct, DBObjDef, DbObjIdentifier, OutputMap, ColumnDef }  from '../project-def';

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function demo() {
  console.log('Taking a break...');
  await sleep(10000);
  console.log('10 second later');
}

onmessage = function (event) {
    console.log("worker.js: event is");
    let proj = (event.data as ProjectStruct);
    for (let obj of proj.selectedObjs['SQL']) {
        //for (let i = 0; i < 10000000; i++) {}
        (<any>postMessage)({cleaned: fnGetCleanName(obj.name)});
    }
};
