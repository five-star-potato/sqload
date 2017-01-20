import { Component, OnInit, NgZone, Pipe } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT, OBJ_TYPE } from './constants';
import { BaseComponent } from './base.component';
import { OrderBy } from './orderby.component';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { ColumnDef, DBObjDef, ProjectService } from "./service/project";

@Component({
    template: `	
        <div class="flexbox-parent">
            <div class="flexbox-item header">
                <h3>Choose one or more tables</h3>
            </div>
            <div class="flexbox-item fill-area content flexbox-item-grow">
                <div class="fill-area-content flexbox-item-grow" style="display:flex; flex-direction:row; padding: 5px">
                    <div style="display:flex; flex-direction:column; width:45%">
                        <p>Available Database Objects</p>
                        <select [(ngModel)]="selectedOpts" class="form-control" multiple style="border: 1px solid gray; flex-grow: 1">
                            <optgroup *ngFor="let objType of ['U','V','P']" label="{{getObjectTypeName(objType)}}">
                                <option *ngFor="let obj of objects[objType] | selectedObjects:false" [value]="obj.id">
                                {{obj.name}}
                                </option>
                            </optgroup>
                        </select>
                    </div>
                    <div style="margin:80px 10px 0px 10px; display:flex; flex-direction:column">
                        <button (click)="selectObjs()"><i class="fa fa-angle-right" aria-hidden="true"></i></button><br>
                        <button (click)="unselectObjs()"><i class="fa fa-angle-left" aria-hidden="true"></i></button>
                    </div>
                    <div style="display:flex; flex-direction:column; width:45%;">
                        <p>Selected Database Objects</p>
                        <select [(ngModel)]="unselectedOpts" class="form-control" multiple style="border: 1px solid gray; flex-grow: 1">
                            <optgroup *ngFor="let objType of ['U','V','P']" label="{{getObjectTypeName(objType)}}">
                                <option *ngFor="let obj of objects[objType] | selectedObjects:true" [value]="obj.id">
                                {{obj.name}}
                                </option>
                            </optgroup>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="flexbox-item footer">
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="back()">Back</button>
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="next()">Next</button>
            </div>
        </div>
    `,
    styleUrls: [
        './css/host.css'
    ]
    // providers: [ WizardStateService ] -- this will create another instance
})
export class ObjectsComponent extends BaseComponent {
    // objects contains all the objects id and anmes from the database, whether they are selected or not
    objects: { [objType:string]: DBObjDef[] } = { 'U':[], 'V':[], 'P':[] }; // U - user table; V - view; P - stored proc
    selectedOpts: any;
    unselectedOpts: any;

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService) {
        super(router, ngZone, wizardStateService, dataService, projectService);
    }
    private selectObjs() {
        for (let objType in this.objects) {
            this.objects[objType].forEach((o) => {
                if (this.selectedOpts.includes(o.id))
                    o.selected = true;
            });
        }
        this.updateGlobalObjectsSelection();
    }
    private unselectObjs() {
        for (let objType in this.objects) {
            this.objects[objType].forEach((o) => {
                if (this.unselectedOpts.includes(o.id))
                    o.selected = false;
            });
        }
        this.updateGlobalObjectsSelection();
    }
    back() {
        this.router.navigate(['/connect']);
    }
    // need to update the sequence # for all the objects that were not selected before
    updateGlobalObjectsSelection() {
        var objs: { [objType:string]: DBObjDef[] } = { 
            'U': [], 'V': [], 'P': [], 'Cu':[]
        };
        var maxSeq:number = 0;
        for (let objType in this.objects) {
            let seq: number = Math.max.apply(Math, this.objects[objType].map(function (o) { return o.sequence; })) | 0;
            if (seq > maxSeq) maxSeq = seq;
        }        
        for (let objType in this.objects) {
            this.objects[objType] .forEach((o) => {
                if (o.selected) {
                    objs[objType].push(o);
                    if (!o.sequence) {
                        maxSeq += 10;
                        o.sequence = maxSeq;
                    }
                }
            });
        }
        this.projectService.selectedObjs = objs;
        this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
    }
    next() {
        this.router.navigate(['/columns']);
    }
    ngOnInit() {
        let prjObjs = this.projectService.selectedObjs;
        //electron.ipcRenderer.send("message");
        this.getSQLFn()(this.projectService.connection, "SELECT object_id, SCHEMA_NAME(schema_id) [Schema], RTRIM(name) [name], RTRIM(type) [type] FROM sys.objects WHERE type in ('U', 'V', 'P')",
            (err, res) => {
                this.ngZone.run(() => {
                    let i: number = 0;
                    res.forEach((row) => {
                        let objName = `${row["Schema"]}.${row["name"]}`;
                        let objType = row["type"];
                        let sel: DBObjDef = prjObjs[objType].find((t) => { // was this table already selected in the project?
                            return t.name == objName;
                        });

                        if (sel) { // previously selected table
                            this.objects[objType].push({
                                name: objName,
                                id: row["object_id"],
                                objType: objType,
                                selected: true,
                                rowcount: sel.rowcount,
                                sequence: sel.sequence
                            });
                        }
                        else {
                            this.objects[objType].push({
                                name: objName,
                                id: row["object_id"],
                                objType: objType,
                                selected: false,
                                rowcount: 100,
                                sequence: null
                            });
                        }
                    });
                });
            }
        );
    }
}