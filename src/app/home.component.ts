import { Component, NgZone, Output, EventEmitter, OnInit } from "@angular/core";
import { Router } from '@angular/router';
import { BaseComponent } from "./base.component";
import { TRON_GLOBAL, TRON_EVENT } from './constants';
import { DataGenerator, ColumnDef, fnGetDataTypeDesc } from './include';
import * as gen from './generator/generators.component';
import { WizardStateService } from "./service/wizard-state";
import { DataService } from "./service/data-ws";
import { Subscription }   from 'rxjs/Subscription';

@Component({
    template: `
        <div class="flexbox-item fill-area content flexbox-item-grow">
            <div class="fill-area-content flexbox-item-grow">
                <h1 style="font-family:Plavsky;opacity:0.5">Greetings</h1>
                <br />
                <strong>Lorem Ipsum</strong> is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
                <br /><br />      
            </div>
        </div>
        
        <div class="flexbox-item footer">
            <a (click)="openProject()" class="btn btn-lg btn-info">Open Project</a>
            <a (click)="next()" class="btn btn-lg btn-primary">Quick Start</a>
        </div>
    `,
    styleUrls: [
        './css/host.css'
    ]
})
export class HomeComponent extends BaseComponent implements OnInit {
      
    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: DataService) {
        super(router, ngZone, wizardStateService, dataService);
    }
    ngOnInit() {
    }

    private reviver(key, value):Date | string  {
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
        this.getNewProjectFn()();
        this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
        document.getElementById("projectTitle").innerHTML = "[New Project]";
        this.router.navigate(['/connect']);
    }

    private openProject() {
        this.getOpenProjectFn()()
            .then(result => {
                // fix the loaded project file. Make sure its in zone.run, otherwise all databinding will file when you hit tables or columns page.
                this.ngZone.run(() => {
                    let project: any = this.getGlobal();
                    let data = JSON.parse(result.data, this.reviver);
                    document.getElementById("projectTitle").innerHTML = result.filename;
                    project.connection.serverName = data.connection.serverName;
                    project.connection.databaseName = data.connection.databaseName;
                    project.connection.userName = data.connection.userName;
                    project.connection.password = data.connection.password;
                    
                    project.selectedTables = data.selectedTables;
                    data.selectedTables.forEach(t => {
                        let cols = data.columnDefs[t.id];
                        for (let i = cols.length - 1; i >= 0; i--) {
                            let c = cols[i];
                            let realColDef: ColumnDef = Object.assign({}, c);
                            cols[i] = realColDef;  
                            if (c.plugIn.length > 0) {
                                let obj = c.plugIn[0];
                                let realPlug: any = new gen[obj.__name__]();
                                Object.assign(realPlug, obj);
                                realColDef.plugIn.splice(0, 1, realPlug);
                            }
                        }
                        project.columnDefs[t.id] = cols;
                    });
                    this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
                    this.router.navigate(['/connect']);
                });
            })
            .catch(err => {
                console.log(err);
            });

    }
}