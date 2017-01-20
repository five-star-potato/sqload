import { NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT } from './constants';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { ProjectService } from "./service/project";

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
    protected getSQLFn():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnExecSQL);
    }
    protected getVerifyConnFn():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnVerifyConnection);
    }
    protected getSaveProjectFn():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnSaveProject);
    }
    protected getOpenProjectFn():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnOpenProject);
    }
    protected getWriteSqlToFileFn():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnWriteSqlToFile);
    }
    protected getMsgBoxFn():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnMsgBox);
    }
    protected getObjectTypeName(t:string) {
        switch (t) {
            case 'U':
                return "Table";
            case 'V':
                return "View";
            case 'P':
                return "Stored Procedure";
            case 'Cu':
                return "Customer SQL";
        }
    }
}