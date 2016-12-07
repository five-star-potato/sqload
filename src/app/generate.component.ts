import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON } from './constants';
import { BaseComponent } from './base.component';
import { ColumnDef, fnGetDataTypeDesc, fnOnlyUnique, fnStringifyNoCircular } from './include';
import { IntegerGenerator, TextGenerator, DateGenerator, UUIDGenerator, CustomSqlGenerator, CustomValueGenerator, FKGenerator } from './generator/generators.component';

@Component({
    template: `	
        <div class="flexbox-parent">
            <div class="flexbox-item header">
                <h3>Generate Data</h3>
            </div>
            
            <div class="flexbox-item fill-area content flexbox-item-grow">
                <div class="fill-area-content flexbox-item-grow" style="display:flex; flex-direction:row; padding: 5px">
                    <div style="display:flex; flex-direction:column">
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
    styles: [`
    `]
})
export class GenerateComponent extends BaseComponent {
    constructor(router: Router,  ngZone: NgZone) { 
        super(router, ngZone);
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
    private generateData() {
        let stmts: string[] = [];
        this.cleanUnusedPlugin();

        let tables = this.getGlobal().selectedTables;
        let colDefs = this.getGlobal().columnDefs;
        tables.forEach((tbl:any) => {
            let tblId = tbl.id;
            let colArr = colDefs[tblId];
            let colNames: string[] = [];
            let variables: string[] = [];
            let vals: string[] = [];
            let fkConstraints: number[] = [];

            // generate declare varialbles
            colArr.forEach((cf:ColumnDef) => {
                if (cf.include) {
                    let varRoot = `${this.getCleanColName(cf.name)}`;
                    cf.variable = '@' + varRoot;
                    stmts.push(`DECLARE ${cf.variable} ${fnGetDataTypeDesc(cf)};`);
                    stmts.push(`DECLARE @T_${varRoot} TABLE ( value ${fnGetDataTypeDesc(cf)} );`); // not all columns need this; so far only the ones that use CustomSqlGenerator needs it
                    colNames.push(cf.name);
                    variables.push(cf.variable);

                    if (cf.plugIn.length == 0 && !cf.fkConstraintID) {
                        console.log("Missing plugin and FK: " + cf.name);
                    }
                    else if (cf.plugIn.length > 0) {
                        // FK generation is different from other generator
                        if (cf.plugIn[0] instanceof FKGenerator) {
                            if (cf.fkConstraintID > 0) {
                                // get the unique set of fk constraints; sometimes FK can have multiple columns. They must be set to point to the same entry in the referenced table
                                if (!fkConstraints.includes(cf.fkConstraintID))
                                    fkConstraints.push(cf.fkConstraintID);
                            }
                        }    
                    }                
                }
            });

            // generate [rowcount] number INSERTS for each table
            for (let i:number = 0; i < tbl.rowcount; i++) {
                vals = [];
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
                if (fkConstraints.length > 0) {
                    // processing FK assignments
                    fkSql = "SELECT TOP 1 ";
                    fkConstraints.forEach((constraintId) => {
                        let refTable: string;
                        let colAssign: string[] = [];
                        colArr.forEach((cf:ColumnDef) => {
                            if (cf.fkConstraintID == constraintId) {
                                refTable = `${cf.fkSchema}.${cf.fkTable}`;
                                colAssign.push(`@${cf.name} = ${cf.fkColumn}`);
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
                stmts.push(str);
                //console.log(str);
            }
        });
        this.getSaveOutputFn()(stmts.join('\n'));
    }
    back() {
        this.router.navigate(['/columns']);
    }

    next() {
        this.generateData();
    }
    private saveProject() {
        this.cleanUnusedPlugin();
        let projectContent = fnStringifyNoCircular(this.getGlobal());
        this.getSaveOutputFn()(projectContent);
    }
    ngOnInit() {
    }
}