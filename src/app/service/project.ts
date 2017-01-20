import { Injectable } from "@angular/core";
import { DataGenerator } from '../include';

//import { TRON_GLOBAL, TRON_EVENT } from '../constants';

export interface ConnectionConfig {
    serverName: string;
    databaseName: string;
    userName: string;
    password?: string
    verified: boolean;
}
export interface DBObjDef {
    id: number;
    name: string;
    objType: string;
    rowcount?: number;
    sequence?: number;
    selected: boolean;
}
export class ColumnDef {
    name: string;
    dataType: string;
    charMaxLen: number = 0;
    precision: number = 0;
    scale: number = 0;
    nullable: boolean = false;
    colDefault: string = "";
    include: boolean = false;
    fkConstraintID: number;
    fkTable: string;
    fkColumn: string;    
    fkSchema: string;
    isIdentity: boolean = false;
    plugIn: DataGenerator[] = []; // DataGenerator sometimes requires much configuration... save the change in case the user switch generator types by mistakes
    variable: string; // placeholder for SQL variable names

    public constructor(
        fields?: {
            name: string;
            dataType: string;
            charMaxLen?: number;
            precision?: number;
            scale?: number;
            nullable?: boolean;
            colDefault?: string;
            include?: boolean;
            fkConstraintID?: number;
            fkTable?: string;
            fkColumn?: string; 
            fkSchema?: string;  
            isIdentity?: boolean;
        }) 
    {
        if (fields) Object.assign(this, fields);
    }
}
export class ProjectStruct {
    connection: ConnectionConfig;
    filePath: string = "";
    selectedObjs: { [objType:string]:DBObjDef[] } = {
        'U': [], 'V': [], 'P': [], 'SQL':[]
    }
    columnDefs: { [ objId: number] : ColumnDef[] } = {};
    constructor() {
        this.connection = {
            serverName: 'DELL',
            databaseName: 'AdventureWorks2014',
            userName: 'sa',
            password: "LongLive1",
            verified: false
        }
    }
}
@Injectable()
export class ProjectService {
    project: ProjectStruct = new ProjectStruct();

    createNewProject() {
        this.project = new  ProjectStruct();
    }
    get connection():ConnectionConfig {
        return this.project.connection;
    }
    get selectedObjs(): { [objType:string]: DBObjDef[] } {
        return this.project.selectedObjs;
    }
    set selectedObjs(val) {
        this.project.selectedObjs = val;
    }
    get columnDefs():{ [ objId: number]: ColumnDef[] } {
        return this.project.columnDefs;
    }
    get serverName():string {
        return this.project.connection.serverName;
    }
    get databaseName():string {
        return this.project.connection.databaseName;
    }
    get userName():string {
        return this.project.connection.userName;
    }
    get password():string {
        return this.project.connection.password;
    }
    set serverName(val:string) {
        if (val !== this.project.connection.serverName) {
            this.project.connection.serverName = val;
            this.project.connection.verified = false;
        }
    }
    set databaseName(val:string) {
        if (val !== this.project.connection.databaseName) {
            this.project.connection.databaseName = val;
            this.project.connection.verified = false;
        }
    }
    set userName(val:string) {
        if (val !== this.project.connection.userName) {
            this.project.connection.userName = val;
            this.project.connection.verified = false;
        }
    }
    set password(val:string) {
        if (val !== this.project.connection.password) {
            this.project.connection.password = val;
            this.project.connection.verified = false;
        }
    }
}