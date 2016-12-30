import { TemplateRef } from '@angular/core';

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

export function fnGetDataTypeDesc(c: ColumnDef) {
    if (c.dataType == "decimal")
        return `decimal(${c.precision},${c.scale})`;
    else if (c.dataType == "varchar" || c.dataType == "char" || c.dataType == "nvarchar" || c.dataType == "nchar") {
        return `${c.dataType}(${c.charMaxLen})`;
    }
    else return c.dataType;
}

export function fnOnlyUnique(value, index, self) { 
    return self.indexOf(value) === index;
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