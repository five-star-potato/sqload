import { DataGenerator } from '../include';


function randomString(length, chars) {
    var mask = '';
    if (chars.indexOf('a') > -1) mask += 'abcdefghijklmnopqrstuvwxyz';
    if (chars.indexOf('A') > -1) mask += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    if (chars.indexOf('#') > -1) mask += '0123456789';
    if (chars.indexOf('!') > -1) mask += '!@#$%^*_+-={}[]:;<>?,.';
    var result = '';
    for (var i = length; i > 0; --i) result += mask[Math.floor(Math.random() * mask.length)];
    return result;
}

//////////////////// Generators ////////////////////////////////////
export class SequenceGenerator extends DataGenerator {
    public max: number = 10000;
    public min: number = 0;
    public incr: number = 1;
    public current: number;

    constructor(dataType?: string) {
        super("SequenceGenerator");
        if (dataType) {
            switch (dataType) {
                case 'tinyint':
                    this.max = 255; this.min = 0;
                    break;

                case 'smallint':
                    this.max = 32765; this.min = 0;
                    break;

                case 'bit':
                    this.max = 1; this.min = 0;
                    break;

                default:
                    this.max = 1000000; this.min = 0;
                    break;
            }
        }
        this.current = this.min;
    }
    generate(): Number {
        let ret = this.current;
        this.current += this.incr;
        if (this.current > this.max) 
            this.current = this.min;
        return ret;
    }
    /* distribution? */
}

export class IntegerGenerator extends DataGenerator {
    public max: number = 100;
    public min: number = 0;

    constructor(dataType?: string) {
        super("IntegerGenerator");
        if (dataType) {
            switch (dataType) {
                case 'tinyint':
                    this.max = 255; this.min = 0;
                    break;

                case 'smallint':
                    this.max = 32765; this.min = 0;
                    break;

                case 'bit':
                    this.max = 1; this.min = 0;
                    break;

                default:
                    this.max = 1000000; this.min = 0;
                    break;
            }
        }
    }
    generate(): Number {
        return Math.floor(Math.random() * (this.max - this.min + 1)) + this.min;
    }
    /* distribution? */
}

export class TextGenerator extends DataGenerator {
    public maxLength: number = 5;

    constructor(maxLength?: number) {
        super("TextGenerator");
        this.maxLength = maxLength;
    }
    generate(): String {
        return randomString(this.maxLength, '#aA');
    }
}

export class DateGenerator extends DataGenerator {
    public max: string = "2000-01-01";
    public min: string = "2020-12-31";

    constructor(max?: string, min?: string) {
        super("DateGenerator");
        if (max)
            this.max = max;
        if (min)
            this.min = min;
    }
    generate(): string {
        // parse the string date back to date
        let d1 = this.min.split("-").map(Number);
        let minDate = new Date(d1[0], d1[1] - 1, d1[2]);
        let d2 = this.min.split("-").map(Number);
        let maxDate = new Date(d2[0], d2[1] - 1, d2[2]);
        
        let dt = new Date(minDate.getTime() + Math.random() * (maxDate.getTime() - minDate.getTime()));
        return dt.getFullYear() + '-' + (dt.getMonth() + 1) + "-" + dt.getDate();
    }
}

export class DateTimeGenerator extends DataGenerator {
    public max: Date = new Date(1970, 1, 1);
    public min: Date = new Date(2000, 1, 1);

    constructor(max?: Date, min?: Date) {
        super("DateTimeGenerator");
        if (max)
            this.max = max;
        if (min)
            this.min = min;
    }
    generate(): string {
        let dt = new Date(this.min.getTime() + Math.random() * (this.max.getTime() - this.min.getTime()));
        return dt.getFullYear() + '-' + (dt.getMonth() + 1) + "-" + dt.getDate() + " " +
            dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + ":" + dt.getMilliseconds();
    }
}

export class CustomValueGenerator extends DataGenerator {
   public value: string;

    constructor(value?: string) {
        super("CustomValueGenerator");
        if (value)
            this.value = value;
    }
    generate(): String {
        return this.value;
    }
}

export class CustomSqlGenerator extends DataGenerator {
    public sql: string;

    constructor(sql?: string) {
        super("CustomSqlGenerator");
        if (sql)
            this.sql = sql;
    }
    generate(): String {
        return this.sql;
    }
}

export class UUIDGenerator extends DataGenerator {
    constructor() { 
        super("UUIDGenerator");        
    }
    generate(): String {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

export class ListItemGenerator extends DataGenerator {
    public items: string[] = ["", "", "", "", "", "", "", "", "", ""];
    constructor(items?: string[]) {
        super("ListItemGenerator");
        if (items)
            this.items = items;
    }
    generate(): String {
        let nonEmpty = this.items.filter(i => i.length > 0);
        return nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
    }
}

// just for the same of completeness
export class FKGenerator extends DataGenerator {
    constructor() { 
        super("FKGenerator");
    }
    generate(): String {
        return "FK";
    }
}

// just for the same of completeness; not really used
export class SampleAddressGenerator extends DataGenerator {
    public region:string;
    public country:string;
    public fieldSpec:string;
    
    constructor() {
        super("SampleAddressGenerator");
    }
    generate(): String {
        return this.fieldSpec;
    }
}





