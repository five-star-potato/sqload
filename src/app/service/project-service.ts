import { Injectable } from "@angular/core";
import { fnGetLargeRandomNumber, fnGetCleanName } from '../include';
import { CommandOutputGenerator  } from '../generator/generators.component';
import { OBJ_TYPE, COL_DIR_TYPE, OBJECT_TYPES_LIST } from "../constants";
import { ConnectionConfig, DbObjIdentifier, ColumnDef, DBObjDef, GroupDef, OutputMap, ProjectStruct } from "../project-def";

// Using a typeguard to check whether it's a group or dbobj
export function fnIsGroup(obj: DBObjDef | GroupDef): obj is GroupDef {
    return (<GroupDef>obj).members !== undefined;
}

@Injectable()
export class ProjectService {
    project: ProjectStruct = new ProjectStruct();
    // Properties
    createNewProject() {
        this.project = new ProjectStruct();
    }

    
    get connection(): ConnectionConfig {
        return this.project.connection;
    }
    get selectedObjs(): { [objType: string]: DBObjDef[] } {
        return this.project.selectedObjs;
    }
    set selectedObjs(val) {
        this.project.selectedObjs = val;
    }
    get outputMaps(): OutputMap[] {
        return this.project.outputMaps;
    }
    get groups(): GroupDef[] {
        return this.project.groups;
    }
    get serverName(): string {
        return this.project.connection.serverName;
    }
    get instanceName(): string {
        return this.project.connection.instanceName;
    }
    get databaseName(): string {
        return this.project.connection.databaseName;
    }
    get userName(): string {
        return this.project.connection.userName;
    }
    get password(): string {
        return this.project.connection.password;
    }
    set serverName(val: string) {
        if (val !== this.project.connection.serverName) {
            this.project.connection.serverName = val;
            this.project.connection.verified = false;
        }
    }
    set instanceName(val: string) {
        if (val !== this.project.connection.instanceName) {
            this.project.connection.instanceName = val;
            this.project.connection.verified = false;
        }
    }
    set databaseName(val: string) {
        if (val !== this.project.connection.databaseName) {
            this.project.connection.databaseName = val;
            this.project.connection.verified = false;
        }
    }
    set userName(val: string) {
        if (val !== this.project.connection.userName) {
            this.project.connection.userName = val;
            this.project.connection.verified = false;
        }
    }
    set password(val: string) {
        if (val !== this.project.connection.password) {
            this.project.connection.password = val;
            this.project.connection.verified = false;
        }
    }
}