import { Injectable } from "@angular/core";
import { Subject } from 'rxjs/Subject';
import { TRON_GLOBAL, TRON_EVENT } from '../constants';
import { ProjectStruct, ProjectService, ConnectionConfig, TableDef, ColumnDef } from './project';

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
        let proj = this.projectService.project;
        if (event.type == TRON_EVENT.refresh) {
            let links:Set<string> = new Set();
            links.add("home"); links.add("connect");
            if (this.isConnectionReady(proj)) {
                links.add("tables");
                if (this.isTableReady(proj)) {
                    links.add("columns");
                    if (this.isColumnReady(proj)) {
                        links.add("rows");
                        if (this.isRowsReady(proj))
                            links.add("generate");
                    }
                }
            }

            this.projectEventSource.next({ type: "activate", urls: links });        
        }
    }

    private isConnectionReady(proj:any):boolean {
        return (proj.connection.serverName && 
                proj.connection.databaseName && 
                proj.connection.userName && 
                proj.connection.password &&
                proj.connection.verified);
    }
    private isTableReady(proj: any):boolean {
        return (proj.selectedTables.length > 0);
    }
    private isColumnReady(proj: any):boolean {
        return !this.isEmpty(proj.columnDefs);
    }
    private isRowsReady(proj: any):boolean {
        let ready:boolean = true;
        proj.selectedTables.forEach(t => {
            if (t.rowcount == 0)
                ready = false;
        });
        return ready;
    }
    //http://stackoverflow.com/questions/679915/how-do-i-test-for-an-empty-javascript-object
    private isEmpty(obj):boolean {
        return Object.keys(obj).length === 0;
    }
}