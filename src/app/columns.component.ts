import { Component, OnInit, NgZone, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT, OBJ_TYPE, OBJECT_TYPES_LIST } from './constants';
import { DataGenerator, fnGetDataTypeDesc } from './include';
import { BaseComponent } from './base.component';
import * as gen from './generator/generators.component';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { ProjectService, DBObjDef, ColumnDef } from "./service/project";

@Component({
    templateUrl: "./columns.component.html",
    styles: [`
    .table > tbody > tr.active td {
        background-color: wheat;
    }
    .table > tbody > tr > td {
     vertical-align: middle;
    }   
    .table-condensed>thead>tr>th, .table-condensed>tbody>tr>th, .table-condensed>tfoot>tr>th, .table-condensed>thead>tr>td, .table-condensed>tbody>tr>td, .table-condensed>tfoot>tr>td{
        padding: 5px;
    }
    `],
    styleUrls: [
        './css/host.css'
    ]
})
export class ColumnsComponent extends BaseComponent implements AfterViewInit {
    @ViewChild('SequenceTemplate') sequenceTemplate: TemplateRef<any>;
    @ViewChild('IntegerTemplate') integerTemplate: TemplateRef<any>;
    @ViewChild('TextTemplate') textTemplate: TemplateRef<any>;
    @ViewChild('DateTemplate') dateTemplate: TemplateRef<any>;
    @ViewChild('DateTimeTemplate') dateTimeTemplate: TemplateRef<any>;
    @ViewChild('FKTemplate') fkTemplate: TemplateRef<any>;
    @ViewChild('UUIDTemplate') uuidTemplate: TemplateRef<any>;
    @ViewChild('DefaultTemplate') defaultTemplate: TemplateRef<any>;
    @ViewChild('CustomSqlTemplate') sqlTemplate: TemplateRef<any>;
    @ViewChild('CustomValueTemplate') valueTemplate: TemplateRef<any>;
    @ViewChild('ListItemTemplate') listItemTemplate: TemplateRef<any>;
    @ViewChild('GivenNameTemplate') givenNameTemplate: TemplateRef<any>;
    @ViewChild('SurnameTemplate') surnameTemplate: TemplateRef<any>;

    objects: { [objType:string]: DBObjDef[] };
    columns: ColumnDef[] = [];
    activeObjId: number;
    activeColDef: ColumnDef = new ColumnDef();
    // this is just to make initial binding working
    dummyAddressGenerator: gen.SampleAddressGenerator = new gen.SampleAddressGenerator(); 

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService) {
        super(router, ngZone, wizardStateService, dataService, projectService);
    }
    back() {
        this.router.navigate(['/objects']);
    }
    next() {
        this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
        this.router.navigate(['/rows']);
    }
    isFirstColumnUsingAddress():boolean {
        for (let cf of this.columns) {
            if (cf.plugIn.length > 0) {
                if (cf.plugIn[0] instanceof gen.SampleAddressGenerator) {
                    return (cf.name == this.activeColDef.name);
                }
            }
        }
    }
    private setActiveObj(objId: number) {
        this.activeObjId = objId;
        this.columns = this.projectService.columnDefs[objId];
    }
    private setActiveColumn(c: ColumnDef) {
        this.activeColDef = c;
    }
    private getTypeDesc(cf: ColumnDef): string {
        return fnGetDataTypeDesc(cf);
    }
    private showTemplateDiv():boolean {
        if (this.activeColDef && this.activeColDef.plugIn.length > 0) {
            if (this.activeColDef.plugIn[0].constructor.name != "SampleAddressGenerator")
                return true;
        }
        return false;
    }
    private showSampleAddressDiv():boolean {
        if (this.activeColDef && this.activeColDef.plugIn.length > 0) {
            if (this.activeColDef.plugIn[0].constructor.name == "SampleAddressGenerator")
                return true;
        }
        return false;
    }
    private changeGenerator(cf: ColumnDef, evt: any) {
        var genName = evt.target.value;
        // Check to see if the "newly" selected generator was previously selected; if so, reuse it; don't want to erase whatever the user has configed before.
        // At the data generation step, we will cleanup unused generators (i.e. not at position 0)
        let i = 0;
        while (i < cf.plugIn.length) {
            if (cf.plugIn[i].constructor.name == genName)
                break;
            i++;
        }
        if (i < cf.plugIn.length) {
            // found existing generator in plugIn array
            let dg = cf.plugIn.splice(i, 1)[0];
            cf.plugIn.unshift(dg);
        }
        else {
            cf.plugIn.unshift(new gen[genName]())
        }
    }
    private getTemplate(cf:ColumnDef): TemplateRef<any> {
        if (cf.plugIn.length > 0) {
            switch (cf.plugIn[0].templateName) {
                case "SequenceTemplate":
                    return this.sequenceTemplate;
                case "IntegerTemplate":
                    return this.integerTemplate;
                case "TextTemplate":
                    return this.textTemplate;
                case "DateTemplate":
                    return this.dateTemplate;
                case "DateTimeTemplate":
                    return this.dateTimeTemplate;
                case "CustomValueTemplate":
                    return this.valueTemplate;
                case "CustomSqlTemplate":
                    return this.sqlTemplate;
                case "UUIDTemplate":
                    return this.uuidTemplate;
                case "FKTemplate":
                    return this.fkTemplate;
                case "ListItemTemplate":
                    return this.listItemTemplate;
                case "GivenNameTemplate":
                    return this.givenNameTemplate;
                case "SurnameTemplate":
                    return this.surnameTemplate;
            }
        }
        return this.defaultTemplate;
    }
    // the name of the constructor will match the <select> value
    private getGeneratorConstructorName(cf: ColumnDef) {
        return cf.plugIn.length > 0 ? cf.plugIn[0].constructor.name : '';
    }
    ngAfterViewInit() {
        //this.setActiveTable(this.tables[0].id);
    }
    private getAllObjects() {
        var allObj:DBObjDef[] = [];
        for (let objType of OBJECT_TYPES_LIST) {
            allObj = allObj.concat(this.objects[objType]);
        }
        return allObj;
    }
    private constructObjectIdsForLoad(objType:string, selectedIds:number[]):number[] {
        let columnDefs = this.projectService.columnDefs;
        let objIds = []; // Create a list of table object Ids for use in constructing the SQL statement
        for (let cnt = this.objects[objType].length, i = 0; i < cnt; i++) {
            objIds.push(this.objects[objType][i].id);
        }
        // check to see which tables are no longer selected
        selectedIds.forEach(k => {
            if (!objIds.includes(k))
                delete columnDefs[k];
        });
        // for tables that are already selected, don't reload the columns ;
        // TODO: what if the table defn changed?
        for (let i = objIds.length - 1; i >= 0; i--) {
            if (columnDefs[objIds[i]] != undefined) {
                objIds.splice(i, 1);
            }
        }
        return objIds;
    }
    private constructCommonPlughInForDataType(cf:ColumnDef):DataGenerator {
        switch (cf.dataType) {
            case "int":
            case "bigint":
            case "tinyint":
            case "smallint":
            case "bit":
                return new gen.IntegerGenerator(cf.dataType);
            case "uniqueidentifier":
                return new gen.UUIDGenerator();
            case "date":
                return new gen.DateGenerator();
            case "datetime":
            case "datetime2":
            case "smalldatetime":
                return new gen.DateTimeGenerator();
            case "char":
            case "nchar":
            case "varchar":
            case "nvarchar":
                if (cf.charMaxLen == 1) {
                    // most likely it's a code  field like Gender
                    let gn:gen.ListItemGenerator = new gen.ListItemGenerator(); 
                    if (cf.name.toLowerCase() == "gender" || cf.name.toLowerCase() == "sex") {
                        gn.items[0] = "M";
                        gn.items[1] = "F";
                    }
                    return gn;
                }
                else 
                    return new gen.TextGenerator(cf.charMaxLen);
            default:
                return null;
        }
    }
    private async loadTableColumnDefs(selectedIds:number[]) {
        let columnDefs = this.projectService.columnDefs;
        let tblIds:number[] = this.constructObjectIdsForLoad(OBJ_TYPE.TB, selectedIds);
        if (tblIds.length == 0)
            return;
        tblIds.forEach(tid => columnDefs[tid] = []);

        let sql = `
            SELECT t.object_id, ic.*, fk.name [fk_constraint_name], fk.object_id [fk_constraint_id], fkc.constraint_column_id [fk_constraint_column_id], fk_rt.name [fk_table_name], fk_rc.name [fk_column_name], SCHEMA_NAME(fk_rt.schema_id) [fk_schema_name], c.is_identity
            FROM sys.columns c
            JOIN sys.tables t ON c.object_id = t.object_id
            LEFT JOIN ( 
                sys.foreign_keys fk 
                JOIN sys.foreign_key_columns fkc ON fk.object_id = fkc.constraint_object_id
                JOIN sys.tables fk_rt ON fk_rt.object_id =  fk.referenced_object_id
                JOIN sys.columns fk_rc ON fk_rt.object_id = fk_rc.object_id AND fk_rc.column_id = fkc.referenced_column_id
            ) ON t.object_id = fk.parent_object_id AND c.column_id = fkc.parent_column_id
            JOIN INFORMATION_SCHEMA.COLUMNS ic ON t.name = ic.TABLE_NAME AND c.name = ic.COLUMN_NAME AND SCHEMA_NAME(t.schema_id) = ic.TABLE_SCHEMA
            WHERE c.object_id in (${tblIds.join()}) AND c.is_computed <> 1 AND c.is_identity <> 1
            order by ic.TABLE_SCHEMA, ic.TABLE_NAME, c.column_id`;
        let dataSet = await this.getSQLFn()(this.projectService.connection, sql,
            (err, res) => {
                this.ngZone.run(() => {
                    let i: number = 0;
                    res.forEach((row) => {
                        let tblId = row["object_id"];

                        let colDef = columnDefs[tblId];
                        if (!colDef) {
                            columnDefs[tblId] = [];
                        }
                        let cf = new ColumnDef({
                            name: row['COLUMN_NAME'],
                            dataType: row['DATA_TYPE'],
                            charMaxLen: row['CHARACTER_MAXIMUM_LENGTH'],
                            precision: row['NUMERIC_PRECISION'],
                            scale: row['NUMERIC_SCALE'],
                            nullable: (row['IS_NULLABLE'] == "YES"),
                            colDefault: row['COLUMN_DEFAULT'],
                            include: (row['COLUMN_DEFAULT'] == null && row['is_identity'] != 1),
                            fkConstraintID: row['fk_constraint_id'],
                            fkTable: row['fk_table_name'],
                            fkColumn: row['fk_column_name'],
                            fkSchema: row['fk_schema_name'],
                            isIdentity: (row["is_identity"] == 1)
                        });
                        if (cf.fkConstraintID) {
                            cf.plugIn.push(new gen.FKGenerator());
                        }
                        else {
                            let dn:DataGenerator = this.constructCommonPlughInForDataType(cf);
                            if (dn)
                                cf.plugIn.push(dn);
                        }
                        if (cf.plugIn.length == 0)    // we don't know how to generate this field
                            cf.include = false;
                        columnDefs[tblId].push(cf);
                    });
                });
            }
        );
    }
    private async loadViewColumnDefs(selectedIds:number[]) {
        let columnDefs = this.projectService.columnDefs;
        let vwIds:number[] = this.constructObjectIdsForLoad(OBJ_TYPE.VW, selectedIds);
        if (vwIds.length == 0)
            return;
        vwIds.forEach(vid => columnDefs[vid] = []);
        
        let sql = `
            SELECT t.object_id, ic.*, c.is_identity
            FROM sys.columns c
            JOIN sys.views t ON c.object_id = t.object_id
            JOIN INFORMATION_SCHEMA.COLUMNS ic ON t.name = ic.TABLE_NAME AND c.name = ic.COLUMN_NAME AND SCHEMA_NAME(t.schema_id) = ic.TABLE_SCHEMA
            WHERE t.object_id in (${vwIds.join()}) AND c.is_computed <> 1 AND c.is_identity <> 1
            order by ic.TABLE_SCHEMA, ic.TABLE_NAME, c.column_id
            `;
        let dataSet = await this.getSQLFn()(this.projectService.connection, sql,
            (err, res) => {
                this.ngZone.run(() => {
                    let i: number = 0;
                    res.forEach((row) => {
                        let vwId = row["object_id"];
                        let colDef = columnDefs[vwId];
                        if (!colDef) {
                            columnDefs[vwId] = [];
                        }
                        let cf = new ColumnDef({
                            name: row['COLUMN_NAME'],
                            dataType: row['DATA_TYPE'],
                            charMaxLen: row['CHARACTER_MAXIMUM_LENGTH'],
                            precision: row['NUMERIC_PRECISION'],
                            scale: row['NUMERIC_SCALE'],
                            nullable: (row['IS_NULLABLE'] == "YES"),
                            colDefault: row['COLUMN_DEFAULT'],
                            include: (row['COLUMN_DEFAULT'] == null && row['is_identity'] != 1),
                            isIdentity: (row["is_identity"] == 1)
                        });
                        let dn:DataGenerator = this.constructCommonPlughInForDataType(cf);
                        if (dn)
                            cf.plugIn.push(dn);
                        if (cf.plugIn.length == 0)    // we don't know how to generate this field
                            cf.include = false;
                        columnDefs[vwId].push(cf);
                    });
                });
            }
        );
    }
    private async loadSPColumnDefs(selectedIds:number[]) {
        let columnDefs = this.projectService.columnDefs;
        let procIds:number[] = this.constructObjectIdsForLoad(OBJ_TYPE.SP, selectedIds);
        if (procIds.length == 0)
            return;
        procIds.forEach(pid => columnDefs[pid] = []);
        
        let sql = `
            SELECT t.object_id, ic.*
            FROM sys.procedures t 
            JOIN INFORMATION_SCHEMA.parameters ic ON t.name = ic.SPECIFIC_NAME AND SCHEMA_NAME(t.schema_id) = ic.SPECIFIC_SCHEMA
            WHERE t.object_id in (${procIds.join()})
            order by ic.SPECIFIC_SCHEMA, ic.SPECIFIC_NAME, ic.ORDINAL_POSITION
        `;
        let dataSet = await this.getSQLFn()(this.projectService.connection, sql,
            (err, res) => {
                this.ngZone.run(() => {
                    let i: number = 0;
                    res.forEach((row) => {
                        let procId = row["object_id"];
                        let colDef = columnDefs[procId];
                        if (!colDef) {
                            columnDefs[procId] = [];
                        }
                        let cf = new ColumnDef({
                            name: row['PARAMETER_NAME'],
                            dataType: row['DATA_TYPE'],
                            charMaxLen: row['CHARACTER_MAXIMUM_LENGTH'],
                            precision: row['NUMERIC_PRECISION'],
                            scale: row['NUMERIC_SCALE'],
                            include: true
                        });
                        let dn:DataGenerator = this.constructCommonPlughInForDataType(cf);
                        if (dn)
                            cf.plugIn.push(dn);
                        if (cf.plugIn.length == 0)    // we don't know how to generate this field
                            cf.include = false;
                        columnDefs[procId].push(cf);
                    });
                });
            }
        );
    }
    private getObjsWithColumnsLoaded(objType:string):number[] {
        let objIdsWithColumnsLoaded:number[] = [];
        let objs = this.objects[objType];
        objs.forEach(t => {
            if (this.projectService.columnDefs.hasOwnProperty(t.id)) {
                objIdsWithColumnsLoaded.push(t.id);
            }
        });
        return objIdsWithColumnsLoaded;
    }
    async ngOnInit() {
        this.objects = this.projectService.selectedObjs;
        let columnDefs = this.projectService.columnDefs;
        // when moving back and forth among pages, we need to maintain states; 
        // If columnDefs.length, the user is revisiting this page - clear the table entries that are no longer valid.
        // If a table Id exists in both selectedTAbles and columnDefs, we don't need to reload column info from DB; take it off from tblIds

        console.log("columnDefs 1");
        console.log(columnDefs);
        let tbls = this.getObjsWithColumnsLoaded(OBJ_TYPE.TB);
        await this.loadTableColumnDefs(tbls);
        console.log("columnDefs 2");
        console.log(columnDefs);
        let vws = this.getObjsWithColumnsLoaded(OBJ_TYPE.VW);
        await this.loadViewColumnDefs(vws);
        console.log("columnDefs 3");
        console.log(columnDefs);
        let procs = this.getObjsWithColumnsLoaded(OBJ_TYPE.SP);
        await this.loadSPColumnDefs(procs);
        console.log("columnDefs 4");
        console.log(columnDefs);
    }

}
