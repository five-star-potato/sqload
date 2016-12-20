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
export class SequenceGenerator implements DataGenerator {
    __name__: string = "SequenceGenerator";
    __template__: string = "SequenceTemplate";
    public max: number = 10000;
    public min: number = 0;
    public incr: number = 1;
    public current: number;

    constructor(dataType?: string) {
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

export class IntegerGenerator implements DataGenerator {
    __name__: string = "IntegerGenerator";
    __template__: string = "IntegerTemplate";
    public max: number = 100;
    public min: number = 0;

    constructor(dataType?: string) {
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

export class TextGenerator implements DataGenerator {
    __name__: string = "TextGenerator";
    __template__: string = "TextTemplate";
    public maxLength: number = 5;

    constructor(maxLength?: number) {
        this.maxLength = maxLength;
    }
    generate(): String {
        return randomString(this.maxLength, '#aA');
    }
}

export class DateGenerator implements DataGenerator {
    __name__: string = "DateGenerator";
    __template__: string = "DateTemplate";
    public max: string = "2000-01-01";
    public min: string = "2020-12-31";

    constructor(max?: string, min?: string) {
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

export class DateTimeGenerator implements DataGenerator {
    __name__: string = "DateTimeGenerator";
    __template__: string = "DateTimeTemplate";
    public max: Date = new Date(1970, 1, 1);
    public min: Date = new Date(2000, 1, 1);

    constructor(max?: Date, min?: Date) {
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

export class CustomValueGenerator implements DataGenerator {
    __name__: string = "CustomValueGenerator";
    __template__: string = "CustomValueTemplate";
    public value: string;

    constructor(value?: string) {
        if (value)
            this.value = value;
    }
    generate(): String {
        return this.value;
    }
}

export class CustomSqlGenerator implements DataGenerator {
    __name__: string = "CustomSqlGenerator";
    __template__: string = "CustomSqlTemplate";
    public sql: string;

    constructor()
    constructor(sql?: string) {
        if (sql)
            this.sql = sql;
    }
    generate(): String {
        return this.sql;
    }
}

export class UUIDGenerator implements DataGenerator {
    __name__: string = "UUIDGenerator";
    __template__: string = "UUIDTemplate";
    constructor() { }

    generate(): String {
        return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

export class ListItemGenerator implements DataGenerator {
    __name__: string = "ListItemGenerator";
    __template__: string = "ListItemTemplate";
    public items: string[] = ["", "", "", "", "", "", "", "", "", ""];

    constructor()
    constructor(items?: string[]) {
        if (items)
            this.items = items;
    }
    generate(): String {
        let nonEmpty = this.items.filter(i => i.length > 0);
        return nonEmpty[Math.floor(Math.random() * nonEmpty.length)];
    }
}

// just for the same of completeness
export class FKGenerator implements DataGenerator {
    __name__: string = "FKGenerator";
    __template__: string = "FKTemplate";
    constructor() { }

    generate(): String {
        return "FK";
    }
}



