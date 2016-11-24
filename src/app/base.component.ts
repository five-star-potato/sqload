import {  NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON } from './constants';

declare var electron: any;

export abstract class BaseComponent {
    protected router: Router;
    protected ngZone: NgZone;
    protected remote: any;

    constructor(router: Router, ngZone: NgZone) { 
        this.router = router;
        this.ngZone = ngZone;
        this.remote = electron.remote;
   }
    abstract next(): void;
    protected getGlobal(name:string):any {
        return this.remote.getGlobal(name);
    }
}