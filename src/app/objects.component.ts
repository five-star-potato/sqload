/* followed the instruction here to integrate with jQuery */
/* http://stackoverflow.com/questions/34762720/using-jquery-globaly-within-angular-2-application */
/// <reference path="../../node_modules/@types/jquery/index.d.ts" />
import { Component, OnInit, NgZone, Pipe } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT, OBJ_TYPE, COL_DIR_TYPE } from './constants';
import { BaseComponent } from './base.component';
import { OrderBy } from './orderby.component';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { ColumnDef, DBObjDef, ProjectService } from "./service/project";
import { fnGetLargeRandomNumber } from './include'
declare var require: (moduleId: string) => any;

@Component({
    template: `	
        <div class="flexbox-parent">
            <div class="flexbox-item header">
                <h3>Choose one or more database objects</h3>
            </div>
            <div class="flexbox-item fill-area content flexbox-item-grow">
                <div class="fill-area-content flexbox-item-grow" style="display:flex; flex-direction:row; padding: 5px">
                    <div style="display:flex; flex-direction:column; width:45%; overflow-y:scroll; border-left:1px solid #DDD; padding-left:4px">
                        <p>Available Database Objects</p>
                        <div *ngFor="let objType of ['U','V','P']">
                            <a href="javascript:void(0)" class="object-type-heading" (click)="toggleAvailView(objType)">
                                <i aria-hidden="true" class="fa fa-chevron-circle-right" style="color:limegreen" *ngIf="isAvailCollapsed[objType]"></i>
                                <i aria-hidden="true" class="fa fa-chevron-circle-down" style="color:darksalmon" *ngIf="!isAvailCollapsed[objType]"></i>
                                &nbsp;{{getObjectTypeName(objType)}}</a><br>
                            <select (change)="setSelected($event.target)" class="form-control" multiple [size]="getAvailObjLength(objType)" 
                                style="border:none;overflow-y:hidden"  [hidden]="isAvailCollapsed[objType] || getAvailObjLength(objType) == 0">
                                <option *ngFor="let obj of objects[objType] | selectedObjects:false" [value]="obj.id">{{obj.name}}</option>
                            </select>
                        </div>
                    </div>
                    <div style="margin:80px 10px 0px 10px; display:flex; flex-direction:column">
                        <button (click)="selectObjsClick()" class="btn btn-sm"><i class="fa fa-arrow-right" aria-hidden="true"></i></button><br>
                        <button (click)="unselectObjsClick()" class="btn btn-sm"><i class="fa fa-arrow-left" aria-hidden="true"></i></button>
                    </div>
                    <div style="display:flex; flex-direction:column; min-width:45%; overflow-y:scroll; border-left:1px solid #DDD; padding-left:4px">
                        <p>Selected Database Objects</p>
                        <div *ngFor="let objType of ['U', 'V', 'P', 'SQL']">
                            <a href="javascript:void(0)" class="object-type-heading" (click)="toggleSelectedView(objType)">
                                <i aria-hidden="true" class="fa fa-chevron-circle-right" style="color:limegreen" *ngIf="isSelectedCollapsed[objType]"></i>
                                <i aria-hidden="true" class="fa fa-chevron-circle-down" style="color:darksalmon" *ngIf="!isSelectedCollapsed[objType]"></i>
                                &nbsp;{{getObjectTypeName(objType)}}</a>
                                
                                <br>
                            <select *ngIf="objType != 'SQL'" (change)="setUnselected($event.target)" class="form-control" multiple [size]="getSelectedObjLength(objType)" 
                                style="border:none;overflow-y:hidden"  [hidden]="isSelectedCollapsed[objType] || getSelectedObjLength(objType) == 0">
                                <option *ngFor="let obj of objects[objType] | selectedObjects:true" [value]="obj.id">{{obj.name}}</option>
                            </select>
                            <div *ngIf="objType == 'SQL'" >
                                <table class="table table-bordered table-condensed" style="margin-left:20px; width:95%" id="tblSQL" [hidden]="isSelectedCollapsed[objType] || getSelectedObjLength(objType) == 0">
                                    <tr *ngFor="let obj of objects['SQL']">
                                        <td>{{obj.name}}</td>
                                        <td style=''><pre>{{obj.sql}}</pre></td>
                                        <td style="min-width:70px"><button class="btn btn-primary btn-xs" (click)="editSQL(obj)"><i class="fa fa-pencil-square-o" aria-hidden="true"></i></button>
                                        &nbsp;<button class="btn btn-danger btn-xs" (click)="deleteSQL(obj)"><i class="fa fa-trash-o" aria-hidden="true"></i></button></td>
                                    </tr>
                                </table>    
                                <button style="margin-bottom:5px; margin-left:20px" class="btn btn-primary btn-sm" (click)="addCustomSQL()">Add</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
            
            <div class="flexbox-item footer">
                <button style="" class='btn btn-primary nav-btn' (click)="back()">Back</button>
                <button style="" class='btn btn-primary nav-btn' (click)="next()">Next</button>
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
            <label>Name</label>
            <input type="text" class="form-control" [(ngModel)]="currSQLName">
        </div>
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
            /* max-height:25px; */
            padding: 2px;
        }
        #tblSQL.table tr td {
        }
        a.object-type-heading {
            font-weight: bold;
            text-decoration: none;
        }
`
    ]
    // providers: [ WizardStateService ] -- this will create another instance
})
export class ObjectsComponent extends BaseComponent {
    // objects contains all the objects id and anmes from the database, whether they are selected or not
    objects: { [objType: string]: DBObjDef[] } = { 'U': [], 'V': [], 'P': [], 'SQL': [] }; // U - user table; V - view; P - stored proc
    selectedOpts: any[] = [];
    unselectedOpts: any[] = [];
    currSQL: string;
    currSQLName: string;
    currSQLObj: DBObjDef;
    tmpSqlVars: string[];
    sqlParser = require('sqlite-parser');

    // isAvailCollapsed and isSelectedCollapsed is to control the open/close of the tree structures of Table/View/Procedure ...
    private isAvailCollapsed: { [objType: string]: boolean } = { 'U': false, 'V': false, 'P': false };
    private isSelectedCollapsed: { [objType: string]: boolean } = { 'U': false, 'V': false, 'P': false };

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService) {
        super(router, ngZone, wizardStateService, dataService, projectService);
    }
    private getAvailObjLength(objType: string) {
        // cannot be zero - if zero, the SELECT elemet becomes actually bigger (i.e. default size?)
        return this.objects[objType].filter(x => !x.selected).length;
    }
    private getSelectedObjLength(objType: string) {
        return this.objects[objType].filter(x => x.selected).length;
    }
    private toggleAvailView(objType: string) {
        this.isAvailCollapsed[objType] = !this.isAvailCollapsed[objType];
    }
    private toggleSelectedView(objType: string) {
        this.isSelectedCollapsed[objType] = !this.isSelectedCollapsed[objType];
    }
    private getFirstResultSet(dbObj:DBObjDef)  {
        dbObj.columns[COL_DIR_TYPE.RSLTSET] = [];
        this.getSQL2Fn()(this.projectService.connection, `exec sp_describe_first_result_set N'${dbObj.sql.replace("'", "''")}'`)
            .then(res => {
                res.forEach((row) => {
                    if (row['is_hidden'] == '0') {
                        let cf = new ColumnDef({
                            name: row['name'],
                            dataType: row['system_type_name'],
                            charMaxLen: row['max_length'],
                            precision: row['precision'],
                            scale: row['scale'],
                            dirType: COL_DIR_TYPE.RSLTSET,
                            ordinal: row['column_ordinal'],
                            dbObjId: dbObj.id
                        });
                        dbObj.columns[COL_DIR_TYPE.RSLTSET].push(cf);
                    }
                });
            })
            .catch(err => {
                this.getMsgBoxFn()("Get First Result Set Error", err.toString());
            });
    }
    private async parseSQL(dbObj:DBObjDef) {
        let objId = dbObj.id;
        let ast = this.sqlParser(dbObj.sql);
        // I have modified sqlite-parser.js in node_modules dist folder. Don't reinstall this package
        // change is: ... peg$otherExpectation("FROM Clause"),function(f,s){return{'from':s,'savedFromStartPos': peg$savedPos};}, ...
        let fromPos = ast.statement[0].savedFromStartPos;
        this.tmpSqlVars = [];
        this.findSqlVars(ast);
        // don't want to completely replaces all the coldefs, because that will erase all the connections too
        // removed unused coldef; add new from tmpVars; leave existing alone; so that connections can be preserved
        let colArr = dbObj.columns[COL_DIR_TYPE.IN_PARAM];
        for (let i = colArr.length - 1; i >= 0; i--) {
            let col:ColumnDef = colArr[i];
            if (!this.tmpSqlVars.find(t => t == col.name))
                colArr.splice(i, 1);
        }
        this.tmpSqlVars.forEach(v => {
            if (!colArr.find(c => c.name == v)) {
                colArr.push(new ColumnDef({
                    name: v,
                    dataType: 'nvarchar(max)',
                    include: true,
                    dirType: COL_DIR_TYPE.IN_PARAM,
                    dbObjId: objId
                }));
            }
        });
        this.getFirstResultSet(dbObj);
    }
    private saveSQLChanges() {
        this.currSQLObj.sql = this.currSQL;
        this.currSQLObj.name = this.currSQLName;
        this.parseSQL(this.currSQLObj);
    }
    private editSQL(obj: DBObjDef) {
        this.currSQLObj = obj;
        this.currSQL = obj.sql;
        this.currSQLName = obj.name;
        jQuery("#modalEditor").modal();
    }
    private deleteSQL(obj) {
        let sqlObjs = this.objects[OBJ_TYPE.SQL];
        for (let i = sqlObjs.length - 1; i >= 0; i--) {
            if (sqlObjs[i].id == obj.id) {
                sqlObjs.splice(i, 1);
                this.currSQLObj = null;
            }
        }
        this.updateGlobalObjectsSelection();
    }
    private addCustomSQL() {
        let newObj = new DBObjDef({
            id: fnGetLargeRandomNumber(), // probably a big random number is enough to make it unique
            name: 'Sample SQL',
            objType: OBJ_TYPE.SQL,
            sql: "select * from Person.Person where BusinessEntityId = @EntityId",
            selected: true
        });
        this.objects[OBJ_TYPE.SQL].push(newObj);
        this.parseSQL(newObj);
        this.updateGlobalObjectsSelection();
        this.rearrangeSequence();
        this.isSelectedCollapsed[OBJ_TYPE.SQL] = false;
    }
    private setSelected(dropdown) {
        this.selectedOpts = [];
        for (var i = 0; i < dropdown.options.length; i++) {
            var optionEle = dropdown.options[i];
            if (optionEle.selected == true) {
                this.selectedOpts.push(parseInt(optionEle.value));
            }
        }
    }
    private setUnselected(dropdown) {
        this.unselectedOpts = [];
        for (var i = 0; i < dropdown.options.length; i++) {
            var optionEle = dropdown.options[i];
            if (optionEle.selected == true) {
                this.unselectedOpts.push(parseInt(optionEle.value));
            }
        }
    }
    private selectObjsClick() {
        for (let objType in this.objects) {
            this.objects[objType].forEach((o) => {
                if (this.selectedOpts.includes(o.id))
                    o.selected = true;
            });
        }
        this.rearrangeSequence();
        this.updateGlobalObjectsSelection();
    }
    private unselectObjsClick() {
        for (let objType in this.objects) {
            this.objects[objType].forEach((o) => {
                if (this.unselectedOpts.includes(o.id))
                    o.selected = false;
            });
        }
        this.rearrangeSequence();
        this.updateGlobalObjectsSelection();
    }
    back() {
        this.router.navigate(['/connect']);
    }
    private findSqlVars(obj) {
        for (var property in obj) {
            if (obj.hasOwnProperty(property)) {
                if (typeof obj[property] == "object") {
                    this.findSqlVars(obj[property]);
                } else {
                    if (property == "type" && obj["type"] == "variable" && obj["format"] == "named")
                        this.tmpSqlVars.push(obj["name"]);
                }
            }
        }
    }
    private rearrangeSequence() {
        // merge all the selected object together and sort it; for sequence = null, leave them at the end (because they are newly selected objects)
        let merged:DBObjDef[] = [];
        Object.keys(this.objects).forEach(objType => merged = merged.concat(this.objects[objType].filter(o => o.selected)));
        merged.sort((a, b) => {
            let s1 = a.sequence || Number.MAX_VALUE;
            let s2 = b.sequence || Number.MAX_VALUE;
            return s1 - s2;
        });
        let seq:number = 1; // make sure don't start with 0 as 0 is false
        merged.forEach(m => m.sequence = seq++);
    }
    // need to update the sequence # for all the objects that were not selected before
    updateGlobalObjectsSelection() {
        var objs: { [objType: string]: DBObjDef[] } = {
            'U': [], 'V': [], 'P': [], 'SQL': []
        };
        for (let objType in this.objects) {
            this.objects[objType].forEach((o) => {
                if (o.selected) {
                    objs[objType].push(o);
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
        this.objects[OBJ_TYPE.SQL] = this.projectService.selectedObjs[OBJ_TYPE.SQL].slice(0);

        //electron.ipcRenderer.send("message");
        this.getSQL2Fn()(this.projectService.connection, "SELECT object_id, SCHEMA_NAME(schema_id) [Schema], RTRIM(name) [name], RTRIM(type) [type] FROM sys.objects WHERE type in ('U', 'V', 'P') ORDER BY 4, 2, 3")
            .then(res => {
                this.ngZone.run(() => {
                    let i: number = 0;
                    res.forEach((row) => {
                        let objName = `${row["Schema"]}.${row["name"]}`;
                        let objType = row["type"];
                        let sel: DBObjDef = prjObjs[objType].find((t) => { // was this table already selected in the project?
                            return t.name == objName;
                        });

                        if (sel) { // previously selected table
                            this.objects[objType].push(new DBObjDef({
                                id: row["object_id"],
                                name: objName,
                                objType: objType,
                                sequence: sel.sequence,
                                instance: sel.instance,
                                selected: true,
                                x: sel.x,
                                y: sel.y,
                                rowcount: sel.rowcount
                            }));
                        }
                        else {
                            this.objects[objType].push(new DBObjDef({
                                id: row["object_id"],
                                name: objName,
                                objType: objType
                            }));
                        }
                    });
                });
            })
            .catch(err => {
                this.getMsgBoxFn()("Loading Database Objects Error", err.toString());
            });
    }
}