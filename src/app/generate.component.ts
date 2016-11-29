import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON } from './constants';
import { BaseComponent } from './base.component';
import { ColumnDef, fnGetDataTypeDesc, fnOnlyUnique } from './include';
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
                <button style="margin-top:30px" class='btn btn-primary' (click)="next()">Save</button>
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
    private generateData() {
        let tables = this.getGlobal().selectedTables;
        let colDefs = this.getGlobal().columnDefs;
        tables.forEach((tbl:any) => {
            let tblId = tbl.value;
            let colArr = colDefs[tblId];
            let colNames: string[] = [];
            let vals: string[] = [];
            let declares: string[] = [];
            let fkConstraints: number[] = [];
            let variables: string[] = [];

            colArr.forEach((cf:ColumnDef) => {
                if (cf.include) {
                    let varName = `@${cf.name}`;
                    variables.push(varName);
                    declares.push(`DECLARE ${varName} ${fnGetDataTypeDesc(cf)};\n`);
                    colNames.push(cf.name);
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
                        else {
                            vals.push(`SET ${varName} = '${cf.plugIn[0].generate()}';\n`);
                        }
                    }
                }
            });
            // processing FK assignments
            let fkSql: string = "SELECT TOP 1 ";
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
            let str = declares.join('') + '\n';
            str += vals.join('') + '\n';
            str += fkSql;
            str += `\nINSERT INTO ${tbl.name}(${colNames.join()}) VALUES(${variables.join()})`;
            this.getSaveOutputFn()(str);
            console.log(str);
        });
    }
    back() {}
    next() {
        this.generateData();
    }
    ngOnInit() {
    }
}