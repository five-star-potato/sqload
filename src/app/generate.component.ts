import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT, NAME_TYPE, OBJ_TYPE } from './constants';
import { BaseComponent } from './base.component';
import { fnGetDataTypeDesc, fnStringifyNoCircular } from './include';
import { SampleAddressGenerator, GivenNameGenerator, SurnameGenerator, IntegerGenerator, TextGenerator, DateGenerator, UUIDGenerator, CustomSqlGenerator, CustomValueGenerator, FKGenerator } from './generator/generators.component';
import { WizardStateService } from "./service/wizard-state";
import { Address, PersonName, SampleDataService } from "./service/sample-data";
import { ColumnDef, DBObjDef, ProjectService } from "./service/project";
declare var require: (moduleId: string) => any;
var appConf = require('../app.conf');

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
                        <p>Overall Progress <span class="blink_me progress_msg">{{progressMsg}}</span></p>
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
    ],
    styles: [
        `
            .progress_msg {
                float:right;
                /* margin-left: 20px; */
            }
            .blink_me {
                animation: blinker 1s linear infinite;
            }

            @keyframes blinker {  
                50% { opacity: 0; }
            }        
        `
    ]
})
export class GenerateComponent extends BaseComponent {
    stmts: string[] = [];
    declareStmts: string[] = [];
    allObjects: DBObjDef[];
    colDefs: any;
    progress: ProgressData[] = [];
    overallProgress: number = 0;
    totalRowCnt: number = 0;
    runningRowCnt: number = 0;
    sampleAdresses = {}; // the assoc array will be { key:  region-country }, values:[] }
    sampleNames = {};
    progressMsg: string = "";
    lineCount: number = 0;
    fileSubDir: string;

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService) {
        super(router, ngZone, wizardStateService, dataService, projectService);
    }
    private cleanUnusedPlugin() {
        var tbls = this.projectService.selectedObjs['U'];
        tbls.forEach(t => {
            if (this.projectService.columnDefs[t.id]) {
                // trim unused plugin; cf.plugins is a list of plugins; only the first one is used. The rest are for users to undo changes only
                this.projectService.columnDefs[t.id].forEach((cf: ColumnDef) => {
                    if (cf.plugIn.length > 1)
                        cf.plugIn.splice(1);
                });
            }
        });
    }
    private getCleanName(name: string) {
        return name.replace(/[\$ #@]/g, '_');
    }
    private substituteAddressField(field: string, addr: any, isSQL:boolean): string {
        var tmp: string = field;
        tmp = field.replace('@id', "'" + addr.id + "'")
            .replace('@lat', "'" + (addr.lat || '0') + "'")
            .replace('@lon', "'" + (addr.lon || '0') + "'")
            .replace('@num', "'" + (addr.num || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@unit', "'" + (addr.unit || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@street', "'" + (addr.street || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@city', "'" + (addr.city || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@region', "'" + (addr.region || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@district', "'" + (addr.district || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@country', "'" + (addr.country || '').replace("'", isSQL ? "''" : "'") + "'")
            .replace('@postcode', "'" + (addr.postcode || '').replace("'", isSQL ? "''" : "'") + "'");
        return `${tmp}`;
    }
    private async generateDataForRow(colArr: ColumnDef[], fkConstraints: Set<number>, colNames: string[], variables: string[], obj: DBObjDef, objProgress: any, objIndex: number, rowCnt: number) {
        let vals: string[] = [];
        let k = 0;
        let incr: number = appConf.options.sqlFileMaxInserts;
        // Don't "setTimeout" every row. How about every XXX rows. Does it improve performance?
        while (k < incr && (rowCnt + k) < obj.rowcount) {
            let addressData: any = null;
            for (let cf of colArr) {
                if (cf.include) {
                    if (cf.plugIn[0] instanceof CustomSqlGenerator) {
                        let tmpTbl = cf.variable.replace('@', '@T_');
                        vals.push(`INSERT INTO ${tmpTbl}(value) EXEC(N'`);
                        vals.push(cf.plugIn[0].generate());
                        vals.push(`');\nSELECT TOP 1 ${cf.variable} = value FROM ${tmpTbl};\nDELETE ${tmpTbl};`);
                    }
                    // getting data from pre-loaded sample addresses
                    else if (cf.plugIn[0] instanceof SampleAddressGenerator) {
                        let expandedField: string, addrVal: string;
                        try {
                            let ag: SampleAddressGenerator = (cf.plugIn[0] as SampleAddressGenerator);
                            if (!addressData) {
                                if (this.sampleAdresses[ag.key].length == 0) {
                                    console.log("no more addresses");
                                    await this.getSampleAddresses();
                                    this.progressMsg = "";
                                }
                                addressData = this.sampleAdresses[ag.key].pop();
                            }
                            if (ag.scriptType == "SQL") {
                                expandedField = this.substituteAddressField(ag.fieldSpec, addressData, true);
                                vals.push(`SELECT ${cf.variable} = ${expandedField};`);
                            }
                            else { // assuming it's JS
                                expandedField = this.substituteAddressField(ag.fieldSpec, addressData, false);
                                addrVal = eval(expandedField);
                                vals.push(`SELECT ${cf.variable} = '${addrVal}';`);
                            }
                        }
                        catch (err) {
                            console.log(expandedField + "-" + err);
                        }
                    }
                    else if (cf.plugIn[0] instanceof GivenNameGenerator) {
                        if (this.sampleNames[NAME_TYPE.FN].length == 0) {
                            console.log("no more given names");
                            await this.getSampleNames();
                            this.progressMsg = "";
                        }
                        let givenName: PersonName = this.sampleNames[NAME_TYPE.FN].pop();
                        vals.push(`SET ${cf.variable} = '${givenName.name}';`);
                    }
                    else if (cf.plugIn[0] instanceof SurnameGenerator) {
                        if (this.sampleNames[NAME_TYPE.LN].length == 0) {
                            console.log("no more given names");
                            await this.getSampleNames();
                            this.progressMsg = "";
                        }
                        let surname: PersonName = this.sampleNames[NAME_TYPE.LN].pop();
                        vals.push(`SET ${cf.variable} = '${surname.name}';`);
                    }
                    else if (!cf.fkConstraintID) {
                        vals.push(`SET ${cf.variable} = '${cf.plugIn[0].generate()}';`);
                    }
                }
            }

            // Processing all the FK constraints per row
            let fkSql: string = "";
            if (fkConstraints.size > 0) {
                // processing FK assignments
                fkSql = "SELECT TOP 1 ";
                fkConstraints.forEach((constraintId) => {
                    let refTable: string;
                    let colAssign: string[] = [];
                    colArr.forEach((cf: ColumnDef) => {
                        if (cf.fkConstraintID == constraintId) {
                            refTable = `${cf.fkSchema}.${cf.fkTable}`;
                            // can't correlate to "variables"" ...
                            colAssign.push(`@${objIndex}$${cf.name} = ${cf.fkColumn}`);
                        }
                    });
                    fkSql += colAssign.join();
                    fkSql += ` FROM ${refTable} ORDER BY NEWID();\n`;
                });
            }
            let str: string = "";
            str += vals.join('\n') + '\n';
            str += fkSql;
            if (obj.objType == OBJ_TYPE.TB || obj.objType == OBJ_TYPE.VW) 
                str += `INSERT INTO ${obj.name}(${colNames.join()}) VALUES(${variables.join()});`;
            else if (obj.objType == OBJ_TYPE.SP) {
                str += `EXEC ${obj.name} ${variables.join()};`;
            }
            else if (obj.objType == OBJ_TYPE.SQL) {
                // just assume all @vars are nvarchar(max) for now
                let declareParams:string = colArr.map(c => c.name).join(" nvarchar(max), ") + " nvarchar(max)";
                str += "EXEC sp_executesql N'" + obj.sql.replace("'","''") + "',N'" + declareParams + "'," + variables.join();
            }
            //console.log(str);
            this.stmts.push(str);
            vals.length = 0;
            k++;
        }
        rowCnt += k;
        this.runningRowCnt += k;
        objProgress.percent = Math.round(rowCnt * 100 / obj.rowcount);
        if (rowCnt < obj.rowcount) {
            this.overallProgress = Math.ceil(this.runningRowCnt * 100 / this.totalRowCnt);
            console.log("overall progress: " + this.overallProgress.toString());
            this.getWriteSqlToFileFn()(this.fileSubDir, this.projectService.connection, this.getCleanName(obj.name), rowCnt, [...this.declareStmts, ...this.stmts]);
            this.stmts = [];
            setTimeout(this.generateDataForRow.bind(this, colArr, fkConstraints, colNames, variables, obj, objProgress, objIndex, rowCnt), 100);
        }
        else {
            objIndex++;
            if (objIndex < this.allObjects.length) {
                setTimeout(this.generateDataForObj.bind(this, objIndex), 50);
            }
            else {
                this.overallProgress = 100;
                this.getWriteSqlToFileFn()(this.fileSubDir, this.projectService.connection, this.getCleanName(obj.name), rowCnt, [...this.declareStmts, ...this.stmts]);
                this.stmts = [];
                this.wizardStateService.hideSpinning();
            }
        }
    }
    private generateDeclareVars(colArr: ColumnDef[], fkConstraints: Set<number>, colNames: string[], variables: string[], obj: DBObjDef, objIndex: number) {
        this.declareStmts = [];
        // generate declare varialbles
        for (let cf of colArr) {
            if (cf.include) {
                let varRoot = `${this.getCleanName(cf.name)}`;
                cf.variable = `@${objIndex}$` + varRoot;
                this.declareStmts.push(`DECLARE ${cf.variable} ${fnGetDataTypeDesc(cf)};`);
                this.declareStmts.push(`DECLARE @T_${objIndex}$${varRoot} TABLE ( value ${fnGetDataTypeDesc(cf)} );`); // not all columns need this; so far only the ones that use CustomSqlGenerator needs it
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
        }

    }
    private generateDataForObj(objIndex: number) {
        let obj: DBObjDef = this.allObjects[objIndex];
        let colArr: ColumnDef[] = this.colDefs[obj.id];
        let colNames: string[] = [];
        let variables: string[] = [];
        let fkConstraints: Set<number> = new Set<number>();

        // generate declare vars
        this.generateDeclareVars(colArr, fkConstraints, colNames, variables, obj, objIndex);
        let objProgress: ProgressData = { name: obj.name, targetRows: obj.rowcount, percent: 0.0 };
        this.progress.push(objProgress);

        // generate [rowcount] number INSERTS for each table
        setTimeout(this.generateDataForRow.bind(this, colArr, fkConstraints, colNames, variables, obj, objProgress, objIndex, 0), 0);
    }
    private async getSampleAddresses() {
        this.progressMsg = "Fetching sample addresses";
        for (let s in this.sampleAdresses) {
            if (this.sampleAdresses[s].length == 0) { // only get addresses when empty
                let key: string[] = s.split('-');
                let arr = await this.dataService.getAddresses(key[0], key[1]);
                this.sampleAdresses[s] = arr;
            }
        }
    }
    private async getSampleNames() {
        this.progressMsg = "Fetching sample names";
        for (let k of [NAME_TYPE.FN, NAME_TYPE.LN]) {
            if (this.sampleNames[k].length == 0) {
                let arr = await this.dataService.getPersonNames(k);
                this.sampleNames[k] = arr;
            }
        }
    }
    private async generateData() {
        let dt = new Date();
        this.fileSubDir = dt.toISOString().replace(/\.\d+/,'').replace(/:/g,'');
        
        let needNames: boolean = false;
        this.cleanUnusedPlugin();
        this.stmts = [];
        this.progress = [];
        // This is where preprocessing happens. E.g. calling data service to get sample addresses and names
        this.allObjects.forEach(t => {
            let colArr = this.colDefs[t.id];
            colArr.forEach((cf: ColumnDef) => {
                if (cf.include) {
                    if (cf.plugIn.length > 0) {
                        // FK generation is different from other generator
                        if (cf.plugIn[0] instanceof SampleAddressGenerator) {
                            let sg: SampleAddressGenerator = cf.plugIn[0] as SampleAddressGenerator;
                            if (!(sg.key in this.sampleAdresses)) {
                                this.sampleAdresses[sg.key] = [];
                            }
                        }
                        if (cf.plugIn[0] instanceof GivenNameGenerator || cf.plugIn[0] instanceof SurnameGenerator) {
                            this.sampleNames[NAME_TYPE.FN] = [];
                            this.sampleNames[NAME_TYPE.LN] = [];
                            needNames = true;
                        }
                    }
                }
            });
        });
        this.allObjects.forEach(t => {
            this.totalRowCnt += (t.rowcount);
        });
        await this.getSampleAddresses();
        if (needNames)
            await this.getSampleNames();
        this.progressMsg = "";
        console.log('left getSampleAddress');
        setTimeout(this.generateDataForObj.bind(this, 0), 0);
    }
    back() {
        this.router.navigate(['/flow']);
    }
    next() {
        this.wizardStateService.showSpinning("generate");
        this.generateData();
    }
    private async saveProject() {
        /*
                let somePromises = [1, 2, 3, 4, 5].map(n => Promise.resolve(n));
                let resolvedPromises = await Promise.all(somePromises);
        */
        this.cleanUnusedPlugin();
        let projectContent = fnStringifyNoCircular(this.projectService);
        this.getSaveProjectFn()(projectContent);
    }
    ngOnInit() {
        this.allObjects = this.getAllObjects();
        this.allObjects.sort((a, b) => a.sequence - b.sequence);
        this.colDefs = this.projectService.columnDefs;
    }
}