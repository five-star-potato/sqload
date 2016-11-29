import { DataGenerator } from '../include';

export class IntegerGenerator implements DataGenerator {
    public max: number;
    public min: number;
    constructor(public dataType: string) {
        switch(dataType) {
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
    generate():Number {
        return Math.floor(Math.random() * (this.max - this.min + 1)) + this.min; 
    }
    /* distribution? */
}

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

export class TextGenerator implements DataGenerator {
    constructor(public maxLength:number) {}
    generate():String {
        return randomString(this.maxLength, '#aA');
    }
}

export class DateGenerator implements DataGenerator {
    constructor(public max:Date, public min:Date) {}
    generate():string {
        let dt = new Date(this.min.getTime() + Math.random() * (this.max.getTime() - this.min.getTime()));
        return dt.getFullYear() + '-' + (dt.getMonth() + 1) + "-" + dt.getDate() + " " + 
               dt.getHours() + ":" + dt.getMinutes() + ":" + dt.getSeconds() + ":" + dt.getMilliseconds(); 
    }
}

export class CustomValueGenerator implements DataGenerator {
    constructor(public value:string) {}
    generate():String {
        return this.value;
    }
}

export class CustomSqlGenerator implements DataGenerator {
    constructor(public sql:string) {}
    generate():String {
        return this.sql;
    }
}

export class UUIDGenerator implements DataGenerator {
    constructor() {}
    generate():String {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
            var r = Math.random()*16|0, v = c == 'x' ? r : (r&0x3|0x8);
            return v.toString(16);
        });    
    }
}

export class ListItemGenerator implements DataGenerator {
    constructor(public items: string[]) {}
    generate():String {
        return this.items[Math.floor(Math.random() * this.items.length)];
    }
}

// just for the same of completeness
export class FKGenerator implements DataGenerator {
    constructor() {}
    generate():String {
        return "FK";
    }
}



