import { Component, NgZone, Output, EventEmitter, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { BaseComponent } from "./base.component";
import { TRON_GLOBAL, TRON_EVENT } from './constants';
import { DataGenerator, fnGetDataTypeDesc } from './include';
import * as gen from './generator/generators.component';
import { WizardStateService } from "./service/wizard-state";
import { ColumnDef, DBObjDef,  ProjectStruct } from "./project-def";
import { ProjectService } from './service/project-service';
import { Subscription } from 'rxjs/Subscription';
import { COL_DIR_TYPE } from './constants';
declare var require: (moduleId: string) => any;

@Component({
    template: `
        <div class="flexbox-item fill-area content flexbox-item-grow">
            <div class="fill-area-content flexbox-item-grow">
                <h1 style="font-family:Plavsky;opacity:0.5">Greetings</h1>
                <br />
                <strong>SQLOAD</strong> is test data generation tool built for SQL Server. We have been using SQL Server 2016 for testing, but it should be backward compatible to version 2012 as well. Our goal is to 
                allow flexible and <i>realistic</i> test data generation. The tool includes various <a href="#">data generators</a> to provide the flexibility of generating data of different shapes. 
                <br /><br />      
                <h5 style="font-family:Arial;opacity:0.5">Version 1.1.1</h5>
            </div>
        </div>
        
        <div class="flexbox-item footer">
            <a (click)="openProject()" class="btn btn-lg btn-info">Open Project</a>
            <a (click)="next()" class="btn btn-lg btn-primary">Quick Start</a>
        </div>
    `,
    styles: [ require('../css/host.scss') ]
})
export class HomeComponent extends BaseComponent implements OnInit {
    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, projectService: ProjectService) {
        super(router, ngZone, wizardStateService, projectService);
    }
    ngOnInit() {
    }
    private reviver(key, value): Date | string {
        let dateFormat = new RegExp(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        if (typeof value == 'string' && dateFormat.test(value)) {
            return new Date(value);
        }
        return value;
    }
    back() {
        this.router.navigate(['/home']);
    }
    next() {
        this.projectService.createNewProject();
        this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
        document.getElementById("projectTitle").innerHTML = "[New Project]";
        document.getElementById("divProjectTitle").style.display = "";
        this.router.navigate(['/connect']);
    }
/*
    private loadColsPlugins(cols:any[]) {
        if (cols) {
            for (let i = cols.length - 1; i >= 0; i--) {
                let c = cols[i];
                let realColDef: ColumnDef = Object.assign({}, c);
                cols[i] = realColDef;
                if (c.plugIn.length > 0) {
                    let obj = c.plugIn[0];
                    let realPlug: any = new gen[obj.__name__](); // all the components within the module "gen" is accessible through [] indexer.
                    // Object.assign can't seem to handle string to date conversino
                    Object.assign(realPlug, obj);
                    realColDef.plugIn.splice(0, 1, realPlug);
                }
            }
        }
    }
*/
    private openProject() {
        this.fnOpenProject()
            .then(result => {
                // fix the loaded project file. Make sure its in zone.run, otherwise all databinding will file when you hit tables or columns page.
                this.ngZone.run(() => {
                    let fileData = JSON.parse(result.data, this.reviver);
                    let data = fileData.project;
                    document.getElementById("projectTitle").innerHTML = result.filename;
                    let project: ProjectStruct = new ProjectStruct().deserialize(data);
                    this.projectService.project = project;
                    this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
                    document.getElementById("divProjectTitle").style.display = "";
                    this.router.navigate(['/connect']);
                });
            })
            .catch(err => {
                console.log(err);
            });

    }
}
