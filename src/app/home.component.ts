import { Component, NgZone } from "@angular/core";
import { Router } from '@angular/router';
import { BaseComponent } from "./base.component";
import { TRON } from './constants';
import { DataGenerator, ColumnDef, fnGetDataTypeDesc } from './include';
import * as gen from './generator/generators.component';

@Component({
    template: `	
        <div class="flexbox-parent">
            <div class="flexbox-item header">
                <h1>Welcome</h1>
            </div>
            
            <div class="flexbox-item fill-area content flexbox-item-grow">
                <div class="fill-area-content flexbox-item-grow">
                    <br /><br />
                    Data generation tool for SQL Server
                    <br /><br />      
                </div>
            </div>
            
            <div class="flexbox-item footer">
                <a (click)="openProject()" class="btn btn-lg btn-info">Open Project</a>
                <a (click)="next()" class="btn btn-lg btn-primary">Quick Start</a>
            </div>
        </div>
    `,
    styles: [`
    `]
})
export class HomeComponent extends BaseComponent {
    constructor(router: Router, ngZone: NgZone) {
        super(router, ngZone);
    }

    dateFormat = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
    private reviver(key, value):Date | string  {
        if (value instanceof "string" && dateFormat.test(value)) {
            return new Date(value);
        }
        
        return value;
    }

    const text = '{ "date": "2016-04-26T18:09:16Z" }';
    const obj = JSON.parse(text, reviver);

    back() { }
    next() {
        this.router.navigate(['/connect']);
    }

    private openProject() {
        let projData = this.getOpenProjectFn()(projectData => {
            // fix the loaded project file. Make sure its in zone.run, otherwise all databinding will file when you hit tables or columns page.
            this.ngZone.run(() => {
                let project: any = this.getGlobal();
                let data = JSON.parse(projectData);
                project.selectedTables = data.selectedTables;
                data.selectedTables.forEach(t => {
                    let cols = data.columnDefs[t.value];
                    for (let i = cols.length - 1; i >= 0; i--) {
                        let c = cols[i];
                        let realColDef: ColumnDef = Object.assign({}, c);
                        cols[i] = realColDef;  
                        if (c.plugIn.length > 0) {
                            let obj = c.plugIn[0];
                            let realPlug: any = new gen[obj.__name__]();
                            Object.assign(realPlug, obj);
                            if (obj.__name__.startWith("Date")) {

                            }
                            realColDef.plugIn.splice(0, 1, realPlug);
                        }
                    }
                    project.columnDefs[t.value] = cols;
                });
                console.log(this.getGlobal().columnDefs);
                this.router.navigate(['/connect']);
                /*

                tbls.forEach(t => {
                    let cols = project.columnDefs[t.value];
                    for (let i = cols.length - 1; i >= 0; i--) {
                        let c = cols[i];
                        let realColDef: ColumnDef = Object.assign({}, c);
                        project.columnDefs[t.value][i] = realColDef; // don't try to point cols[i] to realColDef; it won't affect the original value 
                        if (c.plugIn.length > 0) {
                            let obj = c.plugIn[0];
                            let realPlug: any = new gen[obj.__name__]();
                            Object.assign(realPlug, obj);
                            realColDef.plugIn.splice(0, 1, realPlug);
                        }
                    }
                });

                this.router.navigate(['/connect']);
                console.log(projData);
                */
            });
        });
    }
}