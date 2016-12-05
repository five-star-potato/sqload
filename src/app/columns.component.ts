import { Component, OnInit, NgZone, TemplateRef, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { TRON } from './constants';
import { DataGenerator, ColumnDef, fnGetDataTypeDesc } from './include';
import { BaseComponent } from './base.component';
import * as gen from './generator/generators.component';

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
    `]
})
export class ColumnsComponent extends BaseComponent implements AfterViewInit {
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

    tables: any[] = [];
    columns: ColumnDef[] = [];
    activeTableId: number;
    activeColDef: ColumnDef = new ColumnDef();
    constructor(router: Router, ngZone: NgZone) {
        super(router, ngZone);
    }

    back() {
        this.router.navigate(['/tables']);
    }
    next() {
        //this.getGlobal().columnDefs = this.columns; 
        this.router.navigate(['/rows']);
    }
    private setActiveTable(objId: number) {
        this.activeTableId = objId;
        this.columns = this.getGlobal().columnDefs[objId];
    }
    private setActiveColumn(c: ColumnDef) {
        this.activeColDef = c;
    }
    private toggleInclude(c: ColumnDef):boolean {
        if (c.isIdentity)
            return false;
        
        c.include = !c.include;
        return c.include;
    }
    private getTypeDesc(cf: ColumnDef): string {
        return fnGetDataTypeDesc(cf);
    }
    private changeGenerator(cf: ColumnDef, evt: any) {
        var genName = evt.target.
        value;
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
        console.log("select change");
        console.log(evt);
    }
    private getTemplate(cf:ColumnDef): TemplateRef<any> {
        if (cf.plugIn.length > 0) {
            switch (cf.plugIn[0].__template__) {
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
            }
        }
        return this.defaultTemplate;
    }
    private getGeneratorName(cf: ColumnDef) {
        return cf.plugIn.length > 0 ? cf.plugIn[0].constructor.name : '';
    }
    ngAfterViewInit() {
        //this.setActiveTable(this.tables[0].id);
    }
    ngOnInit() {
        // when moving back and forth among pages, we need to maintain states; 
        // If columnDefs.length, the user is revisiting this page - clear the table entries that are no longer valid.
        // If a table Id exists in both selectedTAbles and columnDefs, we don't need to reload column info from DB; take it off from tblIds
        this.tables = this.getGlobal().selectedTables;
        let columnDefs = this.getGlobal().columnDefs;
        //console.log("active table: " + this.tables[0].id);
        //this.setActiveTable(this.tables[0].id);
        //if (columnDefs[this.activeTableId])
        //    this.setActiveColumn(columnDefs[this.activeTableId][0]);

        let tblIds = []; // Create a list of table object Ids for use in constructing the SQL statement
        for (let i = this.tables.length - 1; i >= 0; i--) {
            tblIds.unshift(this.tables[i].id);
        }
        let keys = []; // get all the "keys" i.e. table Object ID from columnDef. Remove them if the new list of selectedTables does not include them
        for (var key in columnDefs) {
            if (columnDefs.hasOwnProperty(key)) {
                keys.push(parseInt(key));
            }
        }
        keys.forEach(k => {
            if (!tblIds.includes(k))
                delete columnDefs[k];
        });
        // these tables don't need to be reloaded
        for (let i = tblIds.length - 1; i >= 0; i--) {
            if (columnDefs[tblIds[i]] != undefined) {
                tblIds.splice(i, 1);
            }
        }
        if (tblIds.length == 0) // no need to load column info from DB
            return;

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
            WHERE c.object_id in (${tblIds.join()}) AND c.is_computed <> 1
            order by ic.TABLE_SCHEMA, ic.TABLE_NAME, c.column_id`;
        let dataSet = this.getSQLFn()(sql,
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
                            switch (cf.dataType) {
                                case "int":
                                case "bigint":
                                case "tinyint":
                                case "smallint":
                                case "bit":
                                    cf.plugIn.push(new gen.IntegerGenerator(cf.dataType));
                                    break;

                                case "uniqueidentifier":
                                    cf.plugIn.push(new gen.UUIDGenerator());

                                case "date":
                                    cf.plugIn.push(new gen.DateGenerator());
                                    break;
                                case "datetime":
                                case "datetime2":
                                case "smalldatetime":
                                    cf.plugIn.push(new gen.DateTimeGenerator());
                                    break;

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
                                        cf.plugIn.push(gn);
                                    }
                                    else 
                                        cf.plugIn.push(new gen.TextGenerator(cf.charMaxLen));
                                    break;
                                default:
                                    break;
                            }
                        }
                        if (cf.plugIn.length == 0)    // we don't know how to generate this field
                            cf.include = false;
                        columnDefs[tblId].push(cf);
                    });

                    console.log("table columns after");
                    console.log(this.getGlobal().columnDefs);
                });
            }
        );
    }
}
