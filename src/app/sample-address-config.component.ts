import { Component, OnInit, Input, Host, Inject, forwardRef } from "@angular/core";
import { SampleAddressGenerator } from './generator/generators.component';
import { ColumnsComponent } from "./columns.component";

@Component({
    selector: 'sample-address-configurator',
    template: `
        <div>
        <p>* if there are multiple columns in this table that use sample address fields,<br> they will point to the same sample address record. </p>
        <h5>Address Filters</h5>
            <div class="form">
                <div class="form-group">
                    <label for="regionField">Region (leave blank for random region)</label>
                    <input type="text" [(ngModel)]="parent.activeColDef.plugIn[0].region" class="form-control input-sm" id="regionField" placeholder="Comma separated state or province">
                </div>
                <div class="form-group">
                    <label for="countryField">Country (leave blank for random country)</label>
                    <input type="text" [(ngModel)]="parent.activeColDef.plugIn[0].country" class="form-control input-sm" id="countryField" placeholder="country">
                </div>
                <div class="form-group">
                    <label for="fieldsField">Choose Data Fields</label>
                    <textarea [(ngModel)]="parent.activeColDef.plugIn[0].fieldSpec" class="form-control input-sm" id="fieldsField" placeholder="@num @street, @city, @region @country"></textarea>
                </div>
            </div>
        
        </div>
    `
})
export class SampleAddressConfigComponent {
    constructor(@Host() private parent:ColumnsComponent) {
        console.log(parent);
    }
}