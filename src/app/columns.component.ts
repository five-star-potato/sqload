import { Component, OnInit, NgZone, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT, OBJ_TYPE, OBJECT_TYPES_LIST, COL_DIR_TYPE, DIALOG_MSG_TYPE } from './constants';
import { DataGenerator, fnGetDataTypeDesc } from './include';
import { BaseComponent } from './base.component';
import * as gen from './generator/generators.component';
import { WizardStateService } from "./service/wizard-state";
import { DBObjDef, ColumnDef } from "./project-def";
import { ProjectService } from "./service/project-service";
declare var require:(moduleId:string) => any;

@Component({
    templateUrl: "./columns.component.html",
    styles: [
    require('../css/host.scss'),
    `
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
    @ViewChild('CommandOutputTemplate') commandOutputTemplate: TemplateRef<any>;

    objects: { [objType:string]: DBObjDef[] };
    columns: ColumnDef[] = [];
    activeObjId: number;
    activeObjName: string;
    activeColDef: ColumnDef = new ColumnDef();
    // this is just to make initial binding working
    dummyAddressGenerator: gen.SampleAddressGenerator = new gen.SampleAddressGenerator(); 

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, projectService: ProjectService) {
        super(router, ngZone, wizardStateService, projectService);
    }
    back() {
        this.router.navigate(['/objects']);
    }
    next() {
        this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
        this.router.navigate(['/flow']);
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
    private setActiveObj(obj: DBObjDef) {
        this.activeObjId = obj.id;
        this.activeObjName = obj.name;
        if (obj.objType == OBJ_TYPE.TB || obj.objType == OBJ_TYPE.VW)
            this.columns = obj.columns[COL_DIR_TYPE.TBLVW_COL];
        else 
            this.columns = obj.columns[COL_DIR_TYPE.IN_PARAM];
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
                case "CommandOutputTemplate":
                    return this.commandOutputTemplate;
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
    private async loadTableColumnDefs(objIdsWithoutColumn:number[]) {
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
            WHERE c.object_id in (${objIdsWithoutColumn.join()}) AND c.is_computed <> 1 AND c.is_identity <> 1
            order by ic.TABLE_SCHEMA, ic.TABLE_NAME, c.column_id`;
        await this.getSQL2Fn(this.projectService.connection, sql)
            .then(res => {
                this.ngZone.run(() => {
                    let i: number = 0;
                    res.forEach((row) => {
                        let tblId = row["object_id"];

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
                            isIdentity: (row["is_identity"] == 1),
                            dirType: COL_DIR_TYPE.TBLVW_COL,
                            dbObjId: row["object_id"]
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
                        this.projectService.project.getDBObj(tblId).columns[COL_DIR_TYPE.TBLVW_COL].push(cf);
                    });
                });
            })
            .catch(err => {
                this.fnMsgBox("Loading Table Columns Error", err.toString());
            });
    }
    private async loadViewColumnDefs(objIdsWithoutColumns:number[]) {
        let sql = `
            SELECT t.object_id, ic.*, c.is_identity
            FROM sys.columns c
            JOIN sys.views t ON c.object_id = t.object_id
            JOIN INFORMATION_SCHEMA.COLUMNS ic ON t.name = ic.TABLE_NAME AND c.name = ic.COLUMN_NAME AND SCHEMA_NAME(t.schema_id) = ic.TABLE_SCHEMA
            WHERE t.object_id in (${objIdsWithoutColumns.join()}) AND c.is_computed <> 1 AND c.is_identity <> 1
            order by ic.TABLE_SCHEMA, ic.TABLE_NAME, c.column_id
            `;
        await this.getSQL2Fn(this.projectService.connection, sql)
            .then(res => {
                this.ngZone.run(() => {
                    let i: number = 0;
                    res.forEach((row) => {
                        let vwId = row["object_id"];
                        let cf = new ColumnDef({
                            name: row['COLUMN_NAME'],
                            dataType: row['DATA_TYPE'],
                            charMaxLen: row['CHARACTER_MAXIMUM_LENGTH'],
                            precision: row['NUMERIC_PRECISION'],
                            scale: row['NUMERIC_SCALE'],
                            nullable: (row['IS_NULLABLE'] == "YES"),
                            colDefault: row['COLUMN_DEFAULT'],
                            include: (row['COLUMN_DEFAULT'] == null && row['is_identity'] != 1),
                            isIdentity: (row["is_identity"] == 1),
                            dirType: COL_DIR_TYPE.TBLVW_COL,
                            dbObjId: row["object_id"]
                        });
                        let dn:DataGenerator = this.constructCommonPlughInForDataType(cf);
                        if (dn)
                            cf.plugIn.push(dn);
                        if (cf.plugIn.length == 0)    // we don't know how to generate this field
                            cf.include = false;
                        this.projectService.project.getDBObj(vwId).columns[COL_DIR_TYPE.TBLVW_COL].push(cf);
                    });
                });
            })            
            .catch(err => {
                this.fnMsgBox("Loading View Columns Error", err.toString());
            });
    }
    private async loadSPColumnDefs(objIdsWithoutColumns:number[]) {
        let sql = `
            SELECT t.object_id, ic.*
            FROM sys.procedures t 
            JOIN INFORMATION_SCHEMA.parameters ic ON t.name = ic.SPECIFIC_NAME AND SCHEMA_NAME(t.schema_id) = ic.SPECIFIC_SCHEMA
            WHERE t.object_id in (${objIdsWithoutColumns.join()})
            order by ic.SPECIFIC_SCHEMA, ic.SPECIFIC_NAME, ic.ORDINAL_POSITION
        `;
        await this.getSQL2Fn(this.projectService.connection, sql)
            .then(res => {
                this.ngZone.run(() => {
                    let i: number = 0;
                    res.forEach((row) => {
                        let procId = row["object_id"];
                        let cf = new ColumnDef({
                            name: row['PARAMETER_NAME'],
                            dataType: row['DATA_TYPE'],
                            charMaxLen: row['CHARACTER_MAXIMUM_LENGTH'],
                            precision: row['NUMERIC_PRECISION'],
                            scale: row['NUMERIC_SCALE'],
                            include: true,
                            dirType: row['PARAMETER_MODE'] == "IN" || row['PARAMETER_MODE'] == "INOUT" ? COL_DIR_TYPE.IN_PARAM : COL_DIR_TYPE.OUT_PARAM,
                            dbObjId: row["object_id"]
                        });
                        let dn:DataGenerator = this.constructCommonPlughInForDataType(cf);
                        if (dn)
                            cf.plugIn.push(dn);
                        if (cf.plugIn.length == 0)    // we don't know how to generate this field
                            cf.include = false;
                        if (row['PARAMETER_MODE'] == "IN" || row['PARAMETER_MODE'] == "INOUT")
                            this.projectService.project.getDBObj(procId).columns[COL_DIR_TYPE.IN_PARAM].push(cf);
                        else
                            this.projectService.project.getDBObj(procId).columns[COL_DIR_TYPE.OUT_PARAM].push(cf);
                    });
                });
            })
            .catch(err => {
                this.fnMsgBox("Loading SP Columns Error", err.toString());
            });
    }
    private getObjsWithoutColumnsLoaded(objType:string):number[] {
        let objIdsWithoutColumns:number[] = [];
        let objs = this.objects[objType];
        if (objType == OBJ_TYPE.TB || objType == OBJ_TYPE.VW) {
            objs.forEach(t => {
                if (t.columns[COL_DIR_TYPE.TBLVW_COL].length == 0) {
                    objIdsWithoutColumns.push(t.id);
                }
            });
        }
        else { 
            // SP or SQL
            objs.forEach(t => {
                if (t.columns[COL_DIR_TYPE.IN_PARAM].length == 0) {
                    objIdsWithoutColumns.push(t.id);
                }
            });
        }
        return objIdsWithoutColumns;
    }
    async ngOnInit() {
        this.objects = this.projectService.selectedObjs;
        // when moving back and forth among pages, we need to maintain states; 
        // If a database object already has columnDefs defined, we don't need to reload column info from DB; take it off from tblIds

        let tbls = this.getObjsWithoutColumnsLoaded(OBJ_TYPE.TB);
        if (tbls.length)
            await this.loadTableColumnDefs(tbls);
        let vws = this.getObjsWithoutColumnsLoaded(OBJ_TYPE.VW);
        if (vws.length)
            await this.loadViewColumnDefs(vws);
        let procs = this.getObjsWithoutColumnsLoaded(OBJ_TYPE.SP);
        if (procs.length)
            await this.loadSPColumnDefs(procs);
    }

}
