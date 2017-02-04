import { Injectable } from "@angular/core";
import { Subject } from 'rxjs/Subject';
import { TRON_GLOBAL, TRON_EVENT, OBJ_TYPE } from '../constants';
import { ProjectStruct, ProjectService, ConnectionConfig, DBObjDef, ColumnDef } from './project';

@Injectable()
export class WizardStateService {
    private spinningEventSource = new Subject<any>();
    private projectEventSource = new Subject<any>();
    projectEvent$ = this.projectEventSource.asObservable();
    spinningEvent$ = this.spinningEventSource.asObservable();

    constructor(private projectService: ProjectService) {}

    showSpinning(url: string) {
        this.spinningEventSource.next(url);
    }
    hideSpinning() {
        this.spinningEventSource.next("");
    }
    projectChange(event: any) {
        let proj:ProjectStruct = this.projectService.project;
        if (event.type == TRON_EVENT.refresh) {
            let links:Set<string> = new Set();
            links.add("home"); links.add("connect");
            if (this.isConnectionReady(proj)) {
                links.add("objects");
                if (this.isObjectsReady(proj)) {
                    links.add("columns");
                    if (this.isColumnReady(proj)) {
                        links.add("flow");
                        if (this.isRowsReady(proj))
                            links.add("generate");
                    }
                }
            }
            this.projectEventSource.next({ type: "activate", urls: links });        
        }
    }

    private isConnectionReady(proj:ProjectStruct):boolean {
        return (proj.connection.serverName && 
                proj.connection.databaseName && 
                proj.connection.userName && 
                proj.connection.password &&
                proj.connection.verified);
    }
    private isObjectsReady(proj: ProjectStruct):boolean {
        return (proj.selectedObjs[OBJ_TYPE.TB].length > 0 || 
                proj.selectedObjs[OBJ_TYPE.VW].length > 0 || 
                proj.selectedObjs[OBJ_TYPE.SP].length > 0 || 
                proj.selectedObjs[OBJ_TYPE.SQL].length > 0);
    }
    private isColumnReady(proj: ProjectStruct):boolean {
        return !this.isEmpty(proj.columnDefs);
    }
    private isRowsReady(proj: ProjectStruct):boolean {
        for (let objType in proj.selectedObjs) {
            for (let obj of proj.selectedObjs[objType]) {
                if (obj.rowcount == 0)
                    return false;
            }
        }
        return true;
    }
    //http://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
    private isEmpty(obj):boolean {
        return Object.keys(obj).length === 0;
    }
}