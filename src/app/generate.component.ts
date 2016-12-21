import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT } from './constants';
import { BaseComponent } from './base.component';
import { ColumnDef, fnGetDataTypeDesc, fnOnlyUnique, fnStringifyNoCircular } from './include';
import { IntegerGenerator, TextGenerator, DateGenerator, UUIDGenerator, CustomSqlGenerator, CustomValueGenerator, FKGenerator } from './generator/generators.component';
import { WizardStateService } from "./service/wizard-state";

interface ProgressData {
    name: string;
    targetRows: number;
    percent: number;
}

@Component({
    template: `	
        <div class="flexbox-parent">
            <div class="flexbox-item header">
                <h3>Generate Data</h3>
            </div>
            
            <div class="flexbox-item fill-area content flexbox-item-grow">
                <div class="fill-area-content flexbox-item-grow" style="display:flex; flex-direction:row; padding: 5px">
                    <div style="display:flex; flex-direction:column; width:100%">
                        <p>Overall Progress</p>
                        <div class="progress">
                            <div class="progress-bar progress-bar-striped active" role="progressbar"
                            aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" [style.width]="overallProgress + '%'">
                                {{ overallProgress }}%
                            </div>
                        </div>
                        <table class="table" >
                            <thead>
                                <tr>
                                    <th>Table</th>
                                    <th>Target # of Rows</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let p of progress">
                                    <td>{{p.name}}</td>
                                    <td>{{p.targetRows.toLocaleString()}}</td>
                                    <td>
                                        <div class="progress">
                                        <div class="progress-bar progress-bar-warning" role="progressbar" [style.width]="p.percent + '%'">
                                            {{ p.percent }}%
                                        </div>
                                        </div>                          
                                   </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="flexbox-item footer">
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="back()">Back</button>
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="next()">Generate Data</button>
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="saveProject()">Save Project</button>
            </div>
        </div>
    `,
    styleUrls: [
        './css/host.css'
    ]
    // providers: [ WizardStateService ]
})
export class GenerateComponent extends BaseComponent {
    stmts: string[] = [];
    tables:any[];
    colDefs:any;
    progress:ProgressData[] = [];
    overallProgress:number = 0;
    totalRowCnt:number = 0;
    runningRowCnt:number = 0;

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService) {
        super(router, ngZone, wizardStateService);
    }
    private cleanUnusedPlugin() {
        var tbls = this.getGlobal().selectedTables;
        tbls.forEach(t => {
            // trim unused plugin; cf.plugins is a list of plugins; only the first one is used. The rest are for users to undo changes only
            this.getGlobal().columnDefs[t.id].forEach((cf:ColumnDef) => {
                if (cf.plugIn.length > 1) {
                    cf.plugIn.splice(1);
                }
            })
        });
    }
    private getCleanColName(colName: string) {
        return colName.replace(/[\$ #@]/g,'_');
    }
    private generateDataForRow(colArr:any[], fkConstraints:Set<number>, colNames:string[], variables: string[], tbl:any, tblProgress:any, tblCnt:number, rowCnt:number) {
        let vals: string[] = [];
        let k = 0;
        let incr = Math.round(tbl.rowcount / 20);
        if (incr < 100) incr = 100;
        // Don't "setTimeout" every row. How about every XXX rows. Does it improve performance?
        while (k < incr && (rowCnt + k) < tbl.rowcount) {
            colArr.forEach((cf:ColumnDef) => {
                if (cf.include) {
                    if (cf.plugIn[0] instanceof CustomSqlGenerator) {
                        let tmpTbl = cf.variable.replace('@', '@T_');
                        vals.push(`INSERT INTO ${tmpTbl}(value) EXEC(N'`);
                        vals.push(cf.plugIn[0].generate());
                        vals.push(`');\nSELECT TOP 1 ${cf.variable} = value FROM ${tmpTbl};\nDELETE ${tmpTbl};`);
                    }
                    else if (!cf.fkConstraintID) {
                        vals.push(`SET ${cf.variable} = '${cf.plugIn[0].generate()}';`);
                    }
                }
            });

            // Processing all the FK constraints per row
            let fkSql: string = "";
            if (fkConstraints.size > 0) {
                // processing FK assignments
                fkSql = "SELECT TOP 1 ";
                fkConstraints.forEach((constraintId) => {
                    let refTable: string;
                    let colAssign: string[] = [];
                    colArr.forEach((cf:ColumnDef) => {
                        if (cf.fkConstraintID == constraintId) {
                            refTable = `${cf.fkSchema}.${cf.fkTable}`;
                            // can't correlate to "variables"" ...
                            colAssign.push(`@${tblCnt}$${cf.name} = ${cf.fkColumn}`);
                        }
                    });
                    fkSql += colAssign.join();
                    fkSql += ` FROM ${refTable} ORDER BY NEWID();\n`; 
                });
            }
            let str:string = "";
            str += vals.join('\n') + '\n';
            str += fkSql;
            str += `INSERT INTO ${tbl.name}(${colNames.join()}) VALUES(${variables.join()});`;
            //console.log(str);
            this.stmts.push(str);
            vals.length = 0;
            k++;
        }
        rowCnt += k;
        this.runningRowCnt += k;
        tblProgress.percent = Math.round(rowCnt * 100 / tbl.rowcount);
        if (rowCnt < tbl.rowcount) {
            this.overallProgress = Math.ceil(this.runningRowCnt * 100 / this.totalRowCnt);
            console.log("overall progress: " + this.overallProgress.toString());
            setTimeout(this.generateDataForRow.bind(this, colArr, fkConstraints, colNames, variables, tbl, tblProgress, tblCnt, rowCnt), 100);
        }
        else {
            tblCnt++;
            if (tblCnt < this.tables.length) {
                setTimeout(this.generateDataForTable.bind(this, tblCnt), 50);
            }
            else {
                this.overallProgress = 100;
                this.getSaveOutputFn()("sql", this.stmts.join('\n'));
            }
        }
    }
    private generateDataForTable(tblCnt:number) {
        let tbl:any = this.tables[tblCnt];
        let tblId = tbl.id;
        let colArr = this.colDefs[tblId];
        let colNames: string[] = [];
        let variables: string[] = [];
        let fkConstraints: Set<number> = new Set<number>();

        let tblProgress:ProgressData = { name: tbl.name, targetRows: parseInt(tbl.rowcount), percent: 0.0 }; 
        this.progress.push(tblProgress);

        // generate declare varialbles
        colArr.forEach((cf:ColumnDef) => {
            if (cf.include) {
                let varRoot = `${this.getCleanColName(cf.name)}`;
                cf.variable = `@${tblCnt}$` + varRoot;
                this.stmts.push(`DECLARE ${cf.variable} ${fnGetDataTypeDesc(cf)};`);
                this.stmts.push(`DECLARE @T_${tblCnt}$${varRoot} TABLE ( value ${fnGetDataTypeDesc(cf)} );`); // not all columns need this; so far only the ones that use CustomSqlGenerator needs it
                colNames.push(`[${cf.name}]`);
                variables.push(cf.variable);

                if (cf.plugIn.length == 0 && !cf.fkConstraintID) {
                    console.log("Missing plugin and FK: " + cf.name);
                }
                else if (cf.plugIn.length > 0) {
                    // FK generation is different from other generator
                    if (cf.plugIn[0] instanceof FKGenerator) {
                        if (cf.fkConstraintID > 0) {
                            // get the unique set of fk constraints; sometimes FK can have multiple columns. These columns must be set to point to the same entry in the referenced table
                            fkConstraints.add(cf.fkConstraintID);
                        }
                    }    
                }                
            }
        });

        // generate [rowcount] number INSERTS for each table
        setTimeout(this.generateDataForRow.bind(this, colArr, fkConstraints, colNames, variables, tbl, tblProgress, tblCnt, 0), 0);
    }
    private generateData() {
        this.cleanUnusedPlugin();
        this.stmts = [];
        this.progress = [];
        this.tables.forEach(t =>{
            this.totalRowCnt += parseInt(t.rowcount);
        });
        this.tables.sort((b, a) => b.sequence - a.sequence);
        setTimeout(this.generateDataForTable.bind(this, 0), 0);
    }
    back() {
        this.router.navigate(['/rows']);
    }
    next() {
        this.generateData();
    }
    private saveProject() {
        this.cleanUnusedPlugin();
        let projectContent = fnStringifyNoCircular(this.getGlobal());
        this.getSaveOutputFn()("project", projectContent);
    }
    ngOnInit() {
        this.tables = this.getGlobal().selectedTables;
        this.colDefs = this.getGlobal().columnDefs;
    }
}