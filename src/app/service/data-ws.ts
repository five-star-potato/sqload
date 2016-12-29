import { Injectable } from '@angular/core';
import { Headers, Http } from '@angular/http';
import 'rxjs/add/operator/toPromise';
import { Address } from './address';

@Injectable()
export class DataService {
    private headers = new Headers({ 'Content-Type': 'application/json' });
    constructor(private http: Http) { }

    getAddresses(region:string, country:string): Promise<Address[]> {
        return this.http.get(`http://localhost:8081/address?region=${region}&country=${country}&rc=10`)
            .toPromise()
            .then(response => response.json() as Address[])
            .catch(this.handleError);
    }
    private handleError(error: any): Promise<any> {
        console.error('An error occurred', error); // for demo purposes only
        return Promise.reject(error.message || error);
    }
}
