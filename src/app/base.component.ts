import { NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT, OBJECT_TYPES_LIST, OBJ_TYPE, COL_DIR_TYPE } from './constants';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { DBObjDef } from "./project-def";
import { ProjectService } from "./service/project-service";

declare var electron: any;

export abstract class BaseComponent {
    protected router: Router;
    protected ngZone: NgZone;
    protected remote: any;
    protected wizardStateService: WizardStateService;
    protected dataService: SampleDataService;
    protected projectService: ProjectService;

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService) { 
        this.router = router;
        this.ngZone = ngZone;
        this.remote = electron.remote;
        this.wizardStateService = wizardStateService;
        this.dataService = dataService;
        this.projectService = projectService;
   }
    abstract back(): void;
    abstract next(): void;
    get getSQL2Fn():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnExecSQL2);
    }
    get fnVerifyConn():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnVerifyConnection);
    }
    get fnSaveProject():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnSaveProject);
    }
    get fnOpenProject():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnOpenProject);
    }
    get fnWriteSqlToFile():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnWriteSqlToFile);
    }
    get fnMsgBox():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnMsgBox);
    }
    protected getObjectTypeName(t:string) {
        switch (t) {
            case OBJ_TYPE.TB:
                return "Table";
            case OBJ_TYPE.VW:
                return "View";
            case OBJ_TYPE.SP:
                return "Stored Procedure";
            case OBJ_TYPE.SQL:
                return "Customer SQL";
        }
    }
    protected getColumnDirTypeName(t:string) {
        switch (t) {
            case COL_DIR_TYPE.IN_PARAM:
                return "Input Param";
            case COL_DIR_TYPE.OUT_PARAM:
                return "Output Param";
            case COL_DIR_TYPE.RET_VAL:
                return "Return Value";
            case COL_DIR_TYPE.RSLTSET:
                return "Result Set";
            case COL_DIR_TYPE.TBLVW_COL:
                return "Column";
        }
    }
    /*
    protected getAllObjects() {
        var allObj:DBObjDef[] = [];
        for (let objType of OBJECT_TYPES_LIST) {
            allObj = allObj.concat(this.projectService.selectedObjs[objType]);
        }
        return allObj;
    }
    */
}