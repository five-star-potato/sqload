import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON } from './constants';
import { BaseComponent } from './base.component';

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
                            <option *ngFor="let item of tables | selectedObjects:false " [value]="item.value">{{item.name}}</option>
                        </select>
                    </div>
                    <div style="margin:80px 10px 0px 10px; display:flex; flex-direction:column">
                        <button (click)="selectTbls()"><i class="fa fa-angle-right" aria-hidden="true"></i></button><br>
                        <button (click)="unselectTbls()"><i class="fa fa-angle-left" aria-hidden="true"></i></button>
                    </div>
                    <div style="display:flex; flex-direction:column; flex-grow: 1">
                        <p>Selected Tables</p>
                        <select [(ngModel)]="unselectedOpts" class="form-control" multiple style="border: 1px solid gray; flex-grow: 1">
                            <option *ngFor="let item of tables | selectedObjects:true " [value]="item.value">{{item.name}}</option>
                        </select>
                    </div>
                </div>
            </div>
            
            <div class="flexbox-item footer">
                <button style="margin-top:30px" class='btn btn-primary' (click)="back()">Back</button>
                <button style="margin-top:30px" class='btn btn-primary' (click)="next()">Next</button>
            </div>
        </div>
    `,
    styles: [`
    `]
})
export class TablesComponent extends BaseComponent {
    dataSet: any[] = [];
    tables: any[] = [];
    selectedOpts: any;
    unselectedOpts: any;

    constructor(router: Router,  ngZone: NgZone) { 
        super(router, ngZone);
    }
    private selectTbls() {
        this.tables.forEach((t) => {
            if (this.selectedOpts.includes(t.value))
                t.selected = true;
            /*
            let found = this.selectedOpts.filter(x => x == t.value );
            if (found.length > 0) {
                t.selected = true;
            }
            */
        })
    }
    private unselectTbls(sel) {
        this.tables.forEach((t) => {
            if (this.unselectedOpts.includes(t.value))
                t.selected = false;
        })
    }
    back() {
        this.router.navigate(['/connect']);
    }
    next() {
        var tbls = [];
        tbls.length = 0;
        this.tables.forEach((t) => {
            if (t.selected) {
                tbls.push(t);
            }
        }); 
        this.getGlobal().selectedTables = tbls; 
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

                        this.tables.push({
                            name: tblName,
                            value: row["object_id"],
                            selected: (sel.length > 0)
                        });
                    });
                    this.dataSet = res;
                });
            }
        );
    }
}