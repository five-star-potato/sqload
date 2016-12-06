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
                <h3>Set up the number of rows to be generated</h3>
            </div>
            <div class="flexbox-item fill-area content flexbox-item-grow">
                <table class="col-md-6 table table-hover table-sm table-condensed" style="font-size:12px; overflow-y:scroll">
                    <thead>
                        <tr>
                            <th>Table Name</th>
                            <th># Rows to be Generated</th>
                            <th>Sequence</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr *ngFor="let item of tables | orderBy : ['sequence']; let x = index">
                            <td>{{item.name}}</td>
                            <td><input class="form-control" [(ngModel)]="item.rowcount"></td>
                            <td><button [disabled]="x == 0" (click)="moveUp(x)" class="btn btn-sm"><i class="fa fa-arrow-up" aria-hidden="true"></i></button> 
                                <button [disabled]="x == (tables.length - 1)" (click)="moveDown(x)" class="btn btn-sm"><i class="fa fa-arrow-down" aria-hidden="true"></i></button></td>
                        </tr>
                    </tbody>
                </table>
            </div>
            
            <div class="flexbox-item footer">
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="back()">Back</button>
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="next()">Next</button>
            </div>
        </div>
    `,
    styles: [`
    `]
})
export class RowsComponent extends BaseComponent {
    tables: any[] = [];

    constructor(router: Router, ngZone: NgZone) {
        super(router, ngZone);
    }

    private moveUp(index: number) {
        var b = this.tables[index].sequence;
        this.tables[index].sequence = this.tables[index - 1].sequence;
        this.tables[index - 1].sequence = b;
    }
    private moveDown(index: number) {
        var b = this.tables[index].sequence;
        this.tables[index].sequence = this.tables[index + 1].sequence;
        this.tables[index + 1].sequence = b;
    }
    back() { 
        this.router.navigate(['/columns']);
    }
    next() {
        this.router.navigate(['/generate']);
    }
    ngOnInit() {
        this.tables = this.getGlobal().selectedTables;
    }    
}