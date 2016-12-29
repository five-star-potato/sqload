import { Component, OnInit } from "@angular/core";

@Component({
    selector: 'sample-address-configurator',
    template: `
        <div>
        <p>* if there are multiple columns in this table that use sample address fields, they will point to the same sample address record. </p>
            <div class="form">
                <div class="form-group">
                    <label for="regionField">Region (leave blank for random region)</label>
                    <input type="text" [(ngModel)]="activeColDef.plugIn[0].min" class="form-control input-sm" id="regionField" placeholder="Comma separated state or province">
                </div>
                <div class="form-group">
                    <label for="maxField">Upper Bound</label>
                    <input type="text" [(ngModel)]="activeColDef.plugIn[0].max" class="form-control input-sm" id="maxField" placeholder="max">
                </div>
            </div>
        
        </div>
    `
})
export class SampleAddressConfigComponent {

}