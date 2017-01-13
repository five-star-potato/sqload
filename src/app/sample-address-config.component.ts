import { Component, OnInit, Input, Host, Inject, forwardRef } from "@angular/core";
import { SampleAddressGenerator } from './generator/generators.component';
import { ColumnsComponent } from "./columns.component";

@Component({
    selector: 'sample-address-configurator',
    template: `
        <div>
        <h5>Address Filters</h5>
            <div *ngIf="!parent.isFirstColumnUsingAddress()" class="well well-sm">You can only set the filtering criteria in the first column that uses address</div>
            <div class="form">
                <div class="form-group" *ngIf="parent.isFirstColumnUsingAddress()">
                    <label for="regionField">Region (leave blank for random region)</label>
                    <input type="text" [(ngModel)]="parent.activeColDef.plugIn[0].region" class="form-control input-sm" id="regionField" placeholder="Comma separated state or province">
                </div>
                <div class="form-group" *ngIf="parent.isFirstColumnUsingAddress()">
                    <label for="countryField">Country (leave blank for random country)</label>
                    <input type="text" [(ngModel)]="parent.activeColDef.plugIn[0].country" class="form-control input-sm" id="countryField" placeholder="country">
                </div>
                <div class="form-group">
                    <label>Specify the type of scripts for the next input field:</label>
                    <div class="form-inline">
                        <div class="form-group">
                            <label style="padding-left: 10px"><input type="radio" name="scriptType" [checked]="parent.activeColDef.plugIn[0].scriptType == 'JS'" [value]="JS" 
                                        (change)="parent.activeColDef.plugIn[0].scriptType = 'JS'">Javascript (ES6)</label> &nbsp;
                            <label><input type="radio" name="scriptType" [checked]="parent.activeColDef.plugIn[0].scriptType == 'SQL'" [value]="SQL"  
                                        (change)="parent.activeColDef.plugIn[0].scriptType = 'SQL'">T-SQL</label>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label for="fieldsField">Choose Data Fields</label>
                    <textarea [(ngModel)]="parent.activeColDef.plugIn[0].fieldSpec" class="form-control input-sm" id="fieldsField" placeholder="E.g. @num + ', ' + @street"></textarea>
                    <!-- Button trigger modal -->
                    <button type="button" class="btn btn-primary btn-sm" data-toggle="modal" data-target="#addressExpressionInfoModal">
                        <i class="fa fa-info-circle" aria-hidden="true"></i>
                    </button>
                </div>
            </div>
        
        </div>

        <!-- Modal -->
        <div class="modal fade" id="addressExpressionInfoModal" tabindex="-1" role="dialog" aria-labelledby="addressExpressionInfoModalLabel">
        <div class="modal-dialog" role="document">
            <div class="modal-content">
            <div class="modal-header">
                <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
                <h4 class="modal-title" id="addressExpressionInfoModalLabel">Information about data field expressions</h4>
            </div>
            <div class="modal-body">
                <ul class="custom-bullet1">
                    <li>If there are multiple columns in this table that use sample address fields, they will point to the same sample address record</li>
                    <li>Predefined fields are:
                        <ul class="custom-bullet2">
                            <li>@num - street number</li>
                            <li>@street - street name</li>
                            <li>@city - city name</li>
                            <li>@region - Two digint province or state code. E.g. ca, ny, on, ab</li>
                            <li>@country - Two digit country code</li>
                            <li>@lat - Latitude</li>
                            <li>@lon - Longitude</li>
                        </ul>
                    </li>
                    <li>If the type of script is set to JavaScript, you can combine JavaScript with the predefined fields. E.g. <pre>@num + ', ' + @street.toLowerCase()</pre></li>
                    <li>If the type of script is set to T-SQL, you can combine T-SQL with the predefined fields. E.g. <pre>@num + ', ' + UPPER(@street)</pre></li>
                </ul>
            </div>
            <div class="modal-footer">
                <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
            </div>
            </div>
        </div>
        </div>

    `,
    styles: [
        `
        .custom-bullet1 li {
            display: block;
        }

        .custom-bullet1 li:before
        {
            font-family: 'FontAwesome';
            content: '\\f054';
            font-size: 9px;
            float: left;
            margin-top: 4px;
            margin-left: -17px;
        }
        
        .custom-bullet2 li {
            display: block;
            font-style: italic;
        }

        .custom-bullet2 li:before
        {
            font-family: 'FontAwesome';
            content: '\\f0DA';
            font-size: 9px;
            float: left;
            margin-top: 4px;
            margin-left: -17px;
        }
        pre { font-family: monospace; }

        `
    ]
})
export class SampleAddressConfigComponent {
    constructor(@Host() private parent:ColumnsComponent) {
        console.log(parent);
    }
}