import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
declare var require:(moduleId:string) => any;
var appConf = require('../../app.conf');

export class Address {
    id:number;
    lon:number;
    lat:number;
    num: string;
    street: string;
    city: string;
    region: string;
    district: string;
    country: string;
    postcode: string;
}
export class PersonName {
    id: number;
    name: string;
}

@Injectable()
export class SampleDataService {
    private headers = new Headers({ 'Content-Type': 'application/json' });
    constructor(private http: Http) { }

    getAddresses(region:string, country:string): Promise<Address[]> {
        return this.http.get(`${appConf.dataService.url}/address?region=${region}&country=${country}&rc=10000`)
            .toPromise()
            .then(response => response.json() as Address[])
            .catch(this.handleError);
    }
    getPersonNames(nameType:string): Promise<PersonName[]> {
        return this.http.get(`${appConf.dataService.url}/name?nameType=${nameType}&rc=1000`)
            .toPromise()
            .then(response => response.json() as PersonName[])
            .catch(this.handleError);
    }

    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // for demo purposes only
        return Promise.reject(error.message || error);
    }
}
