import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON } from './constants';
declare var electron: any;

@Component({
    template: `	
    <h3>Choose one or more tables</h3>
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
            </div>
        </div>
        <div class="row">
            <div class="col-md-12">
                <button style="margin-top:30px" class='btn btn-primary' (click)="next()">Next</button>
            </div>
        </div>        
    </div>
    `,
    styles: [`
    `]
})
export class ColumnsComponent {
    constructor(private router: Router, private ngZone: NgZone) { }

    private next() {}
    ngOnInit() {
    }
}