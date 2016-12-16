import { NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT } from './constants';
import { WizardStateService } from "./service/wizard-state";

declare var electron: any;

export abstract class BaseComponent {
    protected router: Router;
    protected ngZone: NgZone;
    protected remote: any;
    protected wizardStateService: WizardStateService;

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService) { 
        this.router = router;
        this.ngZone = ngZone;
        this.remote = electron.remote;
        this.wizardStateService = wizardStateService;
   }
    abstract back(): void;
    abstract next(): void;
    protected getGlobal():any {
        return this.remote.getGlobal(TRON_GLOBAL.project);
    }
    protected getSQLFn():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnExecSQL);
    }
    protected getSaveOutputFn():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnSaveOutput);
    }
    protected getOpenProjectFn():any {
        return this.remote.getGlobal(TRON_GLOBAL.fnOpenProject);
    }
    
}