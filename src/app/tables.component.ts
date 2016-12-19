import { Component, OnInit, NgZone, Pipe } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT } from './constants';
import { BaseComponent } from './base.component';
import { OrderBy } from './orderby.component';
import { WizardStateService } from "./service/wizard-state";

@Component({
    template: `	
        <div class="flexbox-parent">
            <div class="flexbox-item header">
                <h3>Choose one or more tables</h3>
            </div>
            
            <div class="flexbox-item fill-area content flexbox-item-grow">
                <div class="fill-area-content flexbox-item-grow" style="display:flex; flex-direction:row; padding: 5px">
                    <div style="display:flex; flex-direction:column">
                        <p>Available Tables</p>
                        <select [(ngModel)]="selectedOpts" class="form-control" multiple style="border: 1px solid gray; flex-grow: 1">
                            <option *ngFor="let item of tables | selectedObjects:false " [value]="item.id">{{item.name}}</option>
                        </select>
                    </div>
                    <div style="margin:80px 10px 0px 10px; display:flex; flex-direction:column">
                        <button (click)="selectTbls()"><i class="fa fa-angle-right" aria-hidden="true"></i></button><br>
                        <button (click)="unselectTbls()"><i class="fa fa-angle-left" aria-hidden="true"></i></button>
                    </div>
                    <div style="display:flex; flex-direction:column; flex-grow: 1">
                        <p>Selected Tables</p>
                        <select [(ngModel)]="unselectedOpts" class="form-control" multiple style="border: 1px solid gray; flex-grow: 1">
                            <option *ngFor="let item of tables | selectedObjects:true " [value]="item.id">{{item.name}}</option>
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
export class TablesComponent extends BaseComponent {
    dataSet: any[] = [];
    tables: any[] = [];
    selectedOpts: any;
    unselectedOpts: any;

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService) {
        super(router, ngZone, wizardStateService);
    }
    private selectTbls() {
        this.tables.forEach((t) => {
            if (this.selectedOpts.includes(t.id))
                t.selected = true;
        })
    }
    private unselectTbls(sel) {
        this.tables.forEach((t) => {
            if (this.unselectedOpts.includes(t.id))
                t.selected = false;
        })
    }
    back() {
        this.router.navigate(['/connect']);
    }
    next() {
        var tbls = [];
        tbls.length = 0;
        let seq:number = Math.max.apply(Math, 
            this.getGlobal().selectedTables.map(function(t) { return t.sequence; })) | 0; // arbitarily starts with 10. If table is brand now, seq is null
        this.tables.forEach((t) => {
            if (t.selected) {
                tbls.push(t);
                if (!t.sequence) {
                    seq += 10;
                    t.sequence = seq;
                }
            }
        }); 
         
        this.getGlobal().selectedTables = tbls;
        this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
        this.router.navigate(['/columns']);
    }
    ngOnInit() {
        let tbls = this.getGlobal().selectedTables;
        //electron.ipcRenderer.send("message");
        let dataSet = this.getSQLFn()("SELECT object_id, SCHEMA_NAME(schema_id) [Schema], OBJECT_NAME(object_id) [Table] FROM sys.tables ORDER BY 2, 3",
            (err, res) => {
                this.ngZone.run(() => {
                    let i:number = 0;
                    res.forEach((row) => {
                        let tblName = `${row["Schema"]}.${row["Table"]}`; 
                        let sel:any = tbls.filter((t) => { // was this table already selected?
                            return t.name == tblName;
                        });

                        if (sel.length > 0) { // previously selected table
                            this.tables.push({
                                name: tblName,
                                id: row["object_id"],
                                selected: true,
                                rowcount: sel[0].rowcount,
                                sequence: sel[0].sequence
                            });
                        }
                        else {
                            this.tables.push({
                                name: tblName,
                                id: row["object_id"],
                                selected: false,
                                rowcount: 100,
                                sequence: null
                            });
                        }
                    });
                    this.dataSet = res;
                });
            }
        );
    }
}