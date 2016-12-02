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

export class IntegerGenerator implements DataGenerator {
    __name__:string = "IntegerGenerator";
    __template__:string = "IntegerTemplate";
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
    __name__:string = "TextGenerator";
    __template__:string = "TextTemplate";
    public maxLength: number = 5;

    constructor(maxLength?: number) {
        this.maxLength = maxLength;
    }
    generate(): String {
        return randomString(this.maxLength, '#aA');
    }
}

export class DateGenerator implements DataGenerator {
    __name__:string = "DateGenerator";
    __template__:string = "DateTemplate";
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
    set minDate(e:string) {
        let part: string[] = e.split('-');
        let d = new Date(Date.UTC(parseInt(part[0]), parseInt(part[1]) - 1, parseInt(part[2])));
        this.min.setFullYear(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
    }
    get minDate() {
        return this.min.toISOString().substring(0, 10);
    }
    set maxDate(e:string) {
        let part: string[] = e.split('-');
        let d = new Date(Date.UTC(parseInt(part[0]), parseInt(part[1]) - 1, parseInt(part[2])));
        this.max.setFullYear(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate() + 1);
    }
    get maxDate() {
        return this.max.toISOString().substring(0, 10);
    }
}

export class DateTimeGenerator implements DataGenerator {
    __name__:string = "DateTimeGenerator";
    __template__:string = "DateTimeTemplate";
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
    set minDate(e:string) {
        this.min = new Date(Date.parse(e));
    }
    get minDate() {
        return this.min.toISOString().substring(0, 16);
    }
    set maxDate(e:string) {
        this.max = new Date(Date.parse(e));
    }
    get maxDate() {
        return this.max.toISOString().substring(0, 16);
    }
}

export class CustomValueGenerator implements DataGenerator {
    __name__:string = "CustomValueGenerator";
    __template__:string = "CustomValueTemplate";
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
    __name__:string = "CustomSqlGenerator";
    __template__:string = "CustomSqlTemplate";
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
    __name__:string = "UUIDGenerator";
    __template__:string = "UUIDTemplate";
    constructor() { }

    generate(): String {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
            var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }
}

export class ListItemGenerator implements DataGenerator {
    __name__:string = "ListItemGenerator";
    __template__:string = "DefaultTemplate";
    public items: string[] = [];

    constructor()
    constructor(items?: string[]) {
        if (items)
            this.items = items;
    }
    generate(): String {
        return this.items[Math.floor(Math.random() * this.items.length)];
    }
}

// just for the same of completeness
export class FKGenerator implements DataGenerator {
    __name__:string = "FKGenerator";
    __template__:string = "FKTemplate";
    constructor() { }

    generate(): String {
        return "FK";
    }
}



