import { Injectable } from "@angular/core";
import { Subject } from 'rxjs/Subject';
import { TRON_GLOBAL, TRON_EVENT } from '../constants';

declare var electron: any;

@Injectable()
export class WizardStateService {
    private projectEventSource = new Subject<any>();
    projectEvent$ = this.projectEventSource.asObservable();

    projectChange(event: any) {
        if (event.type == TRON_EVENT.projectOpened) {
            var proj = electron.remote.getGlobal(TRON_GLOBAL.project);
            // if there are tables selected, activate
            console.log("inside project open");
            console.log(electron.remote.getGlobal(TRON_GLOBAL.project));

            this.projectEventSource.next({ type: "activate", url: "connect" });        
        }
    }
}