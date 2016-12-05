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
                <h1 style="font-family:Plavsky;opacity:0.5">Welcome</h1>
            </div>
            
            <div class="flexbox-item fill-area content flexbox-item-grow">
                <div class="fill-area-content flexbox-item-grow">
                    <br />
                    <strong>Lorem Ipsum</strong> is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
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

    private reviver(key, value):Date | string  {
        let dateFormat = new RegExp(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
        if (typeof value == 'string' && dateFormat.test(value)) {
            return new Date(value);
        }
        return value;
    }

    back() { }
    next() {
        document.getElementById("projectTitle").innerHTML = "[New Project]";
        this.router.navigate(['/connect']);
    }

    private openProject() {
        let projData = this.getOpenProjectFn()((filePath, projectData) => {
            // fix the loaded project file. Make sure its in zone.run, otherwise all databinding will file when you hit tables or columns page.
            this.ngZone.run(() => {
                let project: any = this.getGlobal();
                let data = JSON.parse(projectData, this.reviver);
                document.getElementById("projectTitle").innerHTML = filePath;

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
                this.router.navigate(['/connect']);
            });
        });
    }
}