import { Component, OnInit, Input } from "@angular/core";
import { SampleAddressGenerator } from './generator/generators.component';

@Component({
    selector: 'sample-address-configurator',
    template: `
        <div>
        <p>* if there are multiple columns in this table that use sample address fields, they will point to the same sample address record. </p>
            <div class="form">
                <div class="form-group">
                    <label for="regionField">Region (leave blank for random region)</label>
                    <input type="text" [(ngModel)]="generator.region" class="form-control input-sm" id="regionField" placeholder="Comma separated state or province">
                </div>
                <div class="form-group">
                    <label for="countryField">Upper Bound</label>
                    <input type="text" [(ngModel)]="generator.country" class="form-control input-sm" id="countryField" placeholder="country">
                </div>
            </div>
        
        </div>
    `
})
export class SampleAddressConfigComponent {
    @Input() generator: SampleAddressGenerator;

}