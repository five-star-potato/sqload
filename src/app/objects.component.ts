/* followed the instruction here to integrate with jQuery */
/* http://stackoverflow.com/questions/34762720/using-jquery-globaly-within-angular-2-application */
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
import { Component, OnInit, NgZone, Pipe } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT, OBJ_TYPE } from './constants';
import { BaseComponent } from './base.component';
import { OrderBy } from './orderby.component';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { ColumnDef, DBObjDef, ProjectService } from "./service/project";
import { fnGetLargeRandomNumber } from './include'

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
                            <optgroup *ngFor="let objType of ['U','V','P']" label="{{getObjectTypeName(objType)}}"  >
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
                        <p style="margin-top:10px;margin-bottom:0">Custom SQL Statements &nbsp;&nbsp; <button style="margin-bottom:5px" class="btn btn-primary btn-sm" (click)="addCustomSQL()">Add</button></p>
                        <table class="table table-bordered table-condensed" id="tblSQL">
                            <tr *ngFor="let obj of objects['SQL']">
                                <td>{{obj.name}}</td>
                                <td style=''><pre>{{obj.sql}}</pre></td>
                                <td><button class="btn btn-primary btn-xs" (click)="editSQL(obj)"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></button>
                                &nbsp;<button class="btn btn-danger btn-xs" (click)="deleteSQL(obj)"><i class="fa fa-trash-o" aria-hidden="true"></i></button></td>
                            </tr>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="flexbox-item footer">
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="back()">Back</button>
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="next()">Next</button>
            </div>
        </div>

<div class="modal fade" id="modalEditor" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title">Edit SQL Statement</h4>
      </div>
      <div class="modal-body">
        <div class="form-group">
            <label>SQL Statement</label>
            <textarea class="form-control" [(ngModel)]="currSQL"></textarea>
        </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" data-dismiss="modal" (click)="saveSQLChanges()">Save changes</button>
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
    `,
    styleUrls: [
        './css/host.css'
    ],
    styles: [
        `pre {
            margin:0 !important;
            max-height:25px;
            padding: 2px;
        }
        #tblSQL.table tr td {
        }
`   
    ]
    // providers: [ WizardStateService ] -- this will create another instance
})
export class ObjectsComponent extends BaseComponent {
    // objects contains all the objects id and anmes from the database, whether they are selected or not
    objects: { [objType:string]: DBObjDef[] } = { 'U':[], 'V':[], 'P':[], 'SQL':[] }; // U - user table; V - view; P - stored proc
    selectedOpts: any;
    unselectedOpts: any;
    currSQL: string;
    currSQLObj: DBObjDef;
    
    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService) {
        super(router, ngZone, wizardStateService, dataService, projectService);
    }
    private saveSQLChanges() {
        this.currSQLObj.sql = this.currSQL;
    }
    private editSQL(obj) {
        this.currSQLObj = obj;
        this.currSQL = obj.sql; 
        jQuery("#modalEditor").modal();
    }
    private deleteSQL(obj) {
        let sqlObjs = this.objects[OBJ_TYPE.SQL];
        for(let i = sqlObjs.length - 1; i >=0; i--) {
            if (sqlObjs[i].id == obj.id) {
                sqlObjs.splice(i, 1);
                this.currSQLObj = null;
            }
        }
    }
    private addCustomSQL() {
        this.objects[OBJ_TYPE.SQL].push({
            id: fnGetLargeRandomNumber(), // probably a big random number is enough to make it unique
            name: 'SQL',
            sql: "select 'hello , world'",
            objType: OBJ_TYPE.SQL,
            selected: true
        })
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
            'U': [], 'V': [], 'P': [], 'SQL':[]
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
        this.getSQLFn()(this.projectService.connection, "SELECT object_id, SCHEMA_NAME(schema_id) [Schema], RTRIM(name) [name], RTRIM(type) [type] FROM sys.objects WHERE type in ('U', 'V', 'P') ORDER BY 4, 2, 3",
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