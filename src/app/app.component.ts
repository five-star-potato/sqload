import { Component, OnInit, ViewEncapsulation } from "@angular/core";
import { Router } from "@angular/router";
import { WizardStateService } from "./service/wizard-state";
import { TRON_EVENT } from "./constants"

@Component({
    selector: 'my-app',
    template: `
<div id="divApp" class="container-fluid" style="height:100%; margin: 0 auto">
    <div class="flexbox-parent">
        <div class="flexbox-item header">
            <div class="row">
                <section>
                    <div class="wizard">
                        <div class="wizard-inner">
                            <div class="connecting-line"></div>
                            <ul class="nav nav-tabs" role="tablist">
                                <li role="presentation" [routerLinkActive]="['active']">
                                    <a routerLink="/home" data-toggle="tab" aria-controls="step1" role="tab" title="Greetings">
                                        <span class="round-tab">
                                            <i [style.color]="getLinkColor('home')" class="fa fa-hand-spock-o" aria-hidden="true" style="vertical-align:5%"></i>
                                        </span>
                                    </a>
                                </li>

                                <li role="presentation" [routerLinkActive]="['active']" [class.disabled]="isLinkDisabled('connect')">
                                    <!-- link is enabled -->
                                    <a routerLink="/connect" data-toggle="tab" aria-controls="step2" role="tab" title="connect to a database" *ngIf="!isLinkDisabled('connect')">
                                        <span class="round-tab" [class.round-tab-loading]="urlLoading=='connect'">
                                            <i [style.color]="getLinkColor('connect')" class="fa fa-database" aria-hidden="true" style="vertical-align:5%"></i>
                                        </span>
                                    </a>
                                    <!-- for disabled link -->
                                    <a aria-controls="step2" role="tab" title="connect to a database" *ngIf="isLinkDisabled('connect')">
                                        <span class="round-tab">
                                            <i [style.color]="getLinkColor('connect')" class="fa fa-database" aria-hidden="true" style="vertical-align:5%"></i>
                                        </span>
                                    </a>
                                </li>

                                <li role="presentation" [routerLinkActive]="['active']" [class.disabled]="isLinkDisabled('objects')">
                                    <a routerLink="/objects" data-toggle="tab" aria-controls="step3" role="tab" title="select one or more objects" *ngIf="!isLinkDisabled('objects')">
                                        <span class="round-tab" [class.round-tab-loading]="urlLoading=='objects'">
                                            <i [style.color]="getLinkColor('objects')" class="fa fa-table" aria-hidden="true" style="vertical-align:5%"></i>
                                        </span>
                                    </a>
                                    <a aria-controls="step3" role="tab" title="select one or more objects" *ngIf="isLinkDisabled('objects')">
                                        <span class="round-tab">
                                            <i [style.color]="getLinkColor('objects')" class="fa fa-table" aria-hidden="true" style="vertical-align:5%"></i>
                                        </span>
                                    </a>
                                </li>

                                <li role="presentation" [routerLinkActive]="['active']" [class.disabled]="isLinkDisabled('columns')">
                                    <a routerLink="/columns" data-toggle="tab" aria-controls="step3" role="tab" title="specify the characteristics of each column" *ngIf="!isLinkDisabled('columns')">
                                        <span class="round-tab" [class.round-tab-loading]="urlLoading=='columns'">
                                            <i [style.color]="getLinkColor('columns')" class="fa fa-list-ol" aria-hidden="true" style="vertical-align:5%"></i>
                                        </span>
                                    </a>
                                    <a aria-controls="step3" role="tab" title="specify the characteristics of each column" *ngIf="isLinkDisabled('columns')">
                                        <span class="round-tab">
                                            <i [style.color]="getLinkColor('columns')" class="fa fa-list-ol" aria-hidden="true" style="vertical-align:5%"></i>
                                        </span>
                                    </a>
                                </li>

                                <li role="presentation" [routerLinkActive]="['active']" [class.disabled]="isLinkDisabled('flow')">
                                    <a routerLink="/flow" data-toggle="tab" aria-controls="complete" role="tab" title="manage number of generated entries" *ngIf="!isLinkDisabled('flow')">
                                        <span class="round-tab" [class.round-tab-loading]="urlLoading=='flow'">
                                            <i [style.color]="getLinkColor('flow')" class="fa fa-random" aria-hidden="true" style="vertical-align:5%"></i>
                                        </span>
                                    </a>
                                    <a aria-controls="complete" role="tab" title="manage number of generated entries" *ngIf="isLinkDisabled('flow')">
                                        <span class="round-tab">
                                            <i [style.color]="getLinkColor('flow')" class="fa fa-random" aria-hidden="true" style="vertical-align:5%"></i>
                                        </span>
                                    </a>
                                </li>

                                <li role="presentation" [routerLinkActive]="['active']" [class.disabled]="isLinkDisabled('generate')">
                                    <a routerLink="/generate" data-toggle="tab" aria-controls="complete" role="tab" title="Generate" *ngIf="!isLinkDisabled('generate')">
                                        <span class="round-tab" [class.round-tab-loading]="urlLoading=='generate'">
                                            <i [style.color]="getLinkColor('generate')" class="fa fa-bolt" aria-hidden="true" style="vertical-align:5%"></i>
                                        </span>
                                    </a>
                                    <a aria-controls="complete" role="tab" title="Generate" *ngIf="isLinkDisabled('generate')">
                                        <span class="round-tab">
                                            <i [style.color]="getLinkColor('generate')" class="fa fa-bolt" aria-hidden="true" style="vertical-align:5%"></i>
                                        </span>
                                    </a>
                                </li>
                            </ul>
                        </div>
                    </div>
                </section>
            </div>
        </div>
        
        <router-outlet></router-outlet>
    </div>
</div>
    `,
    styleUrls:  [ './css/wizard.css'],
    encapsulation: ViewEncapsulation.None
})
export class AppComponent implements OnInit {
    private urlLoading: string = "";
    private activeLinks:Set<string> = new Set();
    constructor(private router: Router, private wizardStateService: WizardStateService) {
        this.activeLinks.add("home");
        wizardStateService.projectEvent$.subscribe(event => {
            if (event.type == TRON_EVENT.activate) {
                this.activeLinks = event.urls;
            }
        });
        // specify which Url link should show the spinning SVG; if url == "", turn off spinning icons
        wizardStateService.spinningEvent$.subscribe(url => {
            this.urlLoading = url;
        });
    }
    ngOnInit() {
        //this.router.navigateByUrl('/home');                
    }
    private isLinkDisabled(url:string):boolean {
        return !this.activeLinks.has(url);
    }
    private getLinkColor(url:string):string {
        if (this.isLinkDisabled(url)) 
            return '#eeeeee'
        return '#33cccc';        
    }
}