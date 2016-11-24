import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON } from './constants';
import { BaseComponent } from './base.component';

@Component({
    template: `	
    <h3>Choose one or more tables</h3>
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <select class="form-control" multiple (change)="setSelected($event.target)" style="min-height:400px; border: 1px solid gray">
                    <option *ngFor="let item of options" [value]="item.value">{{item.name}}</option>
                </select>
            </div>
        </div>
        <div class="row">
            <div class="col-md-12">
                <button style="margin-top:30px" class='btn btn-primary' (click)="next()">Next</button>
            </div>
        </div>        
    </div>
    `,
    styles: [`
    `]
})
export class TablesComponent extends BaseComponent {
    dataSet: any[] = [];
    options: any[] = [];

    constructor(router: Router,  ngZone: NgZone) { 
        super(router, ngZone);
    }
    private setSelected(selectEle) {
        for (var i = 0; i < selectEle.options.length; i++) {
            var opt = selectEle.options[i];
            this.options[i].selected = opt.selected;
            if (this.options[i].selected)
                console.log("selected: " + this.options[i].name)
        }
    }
    next() {
        var tbls = this.getGlobal(TRON.selectedTables);
        tbls.length = 0;
        this.options.forEach((opt) => {
            if (opt.selected) {
                tbls.push(opt);
            }
        })
        console.log(tbls);
    }
    ngOnInit() {
        //electron.ipcRenderer.send("message");
        let dataSet = this.getGlobal(TRON.fnExecSQL)("SELECT object_id, SCHEMA_NAME(schema_id) [Schema], OBJECT_NAME(object_id) [Table] FROM sys.tables ORDER BY 2, 3",
            (err, res) => {
                this.ngZone.run(() => {
                    console.log("inside fnExecSQL callback");
                    res.forEach((row) => {
                        this.options.push({
                            name: `${row["Schema"]}.${row["Table"]}`,
                            value: row["object_id"]
                        });
                    });
                    this.dataSet = res;
                    console.log(this.dataSet);
                });
            }
        );
    }
}