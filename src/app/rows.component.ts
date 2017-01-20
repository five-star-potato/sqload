import { Component, NgZone } from "@angular/core";
import { Router } from '@angular/router';
import { BaseComponent } from "./base.component";
import { TRON_GLOBAL, TRON_EVENT } from './constants';
import { DataGenerator, fnGetDataTypeDesc } from './include';
import * as gen from './generator/generators.component';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { ColumnDef, DBObjDef, ProjectService } from "./service/project";

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
    styleUrls: [
        './css/host.css'
    ]
    //providers: [ WizardStateService ]
})
export class RowsComponent extends BaseComponent {
    objects: { [objType:string]: DBObjDef[] };

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService) {
        super(router, ngZone, wizardStateService, dataService, projectService);
    }
/*
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
*/
    back() { 
        this.router.navigate(['/columns']);
    }
    next() {
        this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
        this.router.navigate(['/generate']);
    }
    ngOnInit() {
        this.objects = this.projectService.selectedObjs;
    }    
}