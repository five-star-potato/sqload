import { WORKER_MSG_TYPE } from "./constants";
import { DBObjDef, GroupDef, ColumnDef } from './project-def';

export abstract class DataGenerator {
    __name__:string;    // when serializing the object into JSON string, the name of the subtypes (like ListItemGenerator) will be lost. __name__ helps deserialize it back.
    get templateName(): string {
        // if the generator is named "DateTimeGenerator", the template is named "DateTimeTemplate"
        return this.__name__.replace(/Generator$/, "Template");
    }
    constructor(name:string) {
        this.__name__ = name;
    }
    abstract generate():any;
}

export function fnGetDataTypeDesc(c: ColumnDef) {
    if (c.dataType == "decimal")
        return `decimal(${c.precision},${c.scale})`;
    else if (c.dataType == "varchar" || c.dataType == "char" || c.dataType == "nvarchar" || c.dataType == "nchar") {
        return `${c.dataType}(${c.charMaxLen})`;
    }
    else return c.dataType;
}

//http://stackoverflow.com/questions/11616630/json-stringify-avoid-typeerror-converting-circular-structure-to-json
export function fnStringifyNoCircular(o:any) {
    let cache = [];
    let s = JSON.stringify(o, function(key, value) {
        if (typeof value === 'object' && value !== null) {
            if (cache.indexOf(value) !== -1) {
                // Circular reference found, discard key
                return;
            }
            // Store value in our collection
            cache.push(value);
        }
        return value;
    });
    cache = null; // Enable garbage collection
    return s;    
}

export function fnGetLargeRandomNumber() {
    return Math.floor(Math.random() * 900000000);
}

export function fnGetCleanName(name: string) {
    return name.replace(/[\$ #@]/g, '_');
}

export class WorkerMessage {
    msgType: WORKER_MSG_TYPE;
    data: Object;

    public constructor(
        fields?: {
            msgType?: WORKER_MSG_TYPE;
            data?: Object;
        }) {
        if (fields) Object.assign(this, fields);
    }
}
 
export class ProgressData {
    name: string;
    targetRows: number;
    percent: number;

    public constructor(
        fields?: {
            name: string;
            targetRows: number;
            percent: number;
        }) {
        if (fields) Object.assign(this, fields);
    }
}
