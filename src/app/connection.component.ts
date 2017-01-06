import { Component, OnInit, NgZone, ViewChild, AfterViewInit } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT } from "./constants";
import { BaseComponent } from './base.component';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { ConnectionConfig, ProjectService } from "./service/project";

@Component({
	template: `
  <form (ngSubmit)="next()" #connectForm="ngForm" style="height:100%; display: flex; flex-direction:column; flex-grow:1">
      <div class="flexbox-item fill-area content flexbox-item-grow" style="flex-direction:column">
        <h3>Connect to your database</h3>
        <br>
        <div class="col-md-8" style="margin-left:-15px">
          <div class="form-group">
            <label for="serverName">Server Name</label> 
            <input type="text" [(ngModel)]="this.projectService.serverName" ngControl="serverName" name="serverName" id="serverName" required class="form-control" placeholder="Server" />
          </div>

          <div class="form-group">
            <label for="databaseName">Database Name</label> 
            <input type="text" [(ngModel)]="this.projectService.databaseName"  ngControl="databaseName" name="databaseName" id="databaseName" required class="form-control" placeholder="Database Name" />
          </div>

          <div class="form-group">
            <label for="userName">User Name</label> 
            <input type="text" [(ngModel)]="this.projectService.userName" ngControl="userName" name="userName" id="userName" required class="form-control" placeholder="User Name" />
          </div>

          <div class="form-group">
            <label for="password">Password</label> 
            <input type="password" [(ngModel)]="this.projectService.password" ngControl="password" name="password" id="password" required class="form-control" placeholder="Password" />
          </div>
        </div>
      </div>

      <div class="flexbox-item footer">
          <!-- <button class='btn btn-primary nav-btn' (click)="back()">Back</button> -->
          <button type="submit" [disabled]="!connectForm.form.valid" class='btn btn-primary nav-btn'>Connect</button>
        </div>
  </form>
    `,
	styleUrls: [
		'./css/host.css'
	],
	styles: [
		`
    .ng-valid[required], .ng-valid.required  {
      border-left: 5px solid #42A948; /* green */
    }
    .ng-invalid:not(form)  {
      border-left: 5px solid #a94442; /* red */
    }
    `
	]
})
export class ConnectionComponent extends BaseComponent implements OnInit, AfterViewInit {
	@ViewChild('connectForm') form;
	dataSet: any[] = [];

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService) {
        super(router, ngZone, wizardStateService, dataService, projectService);
    }
	back() {
		// Crashing chromium once a project is opened
		/*
	[18392:1220/000832:ERROR:gles2_cmd_decoder.cc(15300)] [.DisplayCompositor-0000015CE6B08440]GL ERROR :GL_INVALID_OPERATION : glCreateAndConsumeTextureCHROMIUM: invalid mailbox name
	[18392:1220/000832:ERROR:gles2_cmd_decoder.cc(8605)] [.DisplayCompositor-0000015CE6B08440]RENDER WARNING: texture bound to texture unit 0 is not renderable. It maybe non-power-of-2 and have incompatible texture filtering.
	[18392:1220/000832:ERROR:gles2_cmd_decoder.cc(15300)] [.DisplayCompositor-0000015CE6B08440]GL ERROR :GL_INVALID_OPERATION : glCreateAndConsumeTextureCHROMIUM: invalid mailbox name
	[18392:1220/000832:ERROR:gles2_cmd_decoder.cc(8605)] [.DisplayCompositor-0000015CE6B08440]RENDER WARNING: texture bound to texture unit 0 is not renderable. It maybe non-power-of-2 and have incompatible texture filtering.
		*/
		//this.router.navigate(['/home']);
	}
	next() {
		this.wizardStateService.showSpinning('connect');
		this.getVerifyConnFn()(this.projectService.connection,
			(err, res) => {
				this.ngZone.run(() => {
					if (err)
						this.getMsgBoxFn()("Database Connection Error", err.toString());
					else {
						this.projectService.connection.verified = true;
						this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
						this.router.navigate(['/tables']);
					}
					this.wizardStateService.hideSpinning();
				})
			});
	}
	ngAfterViewInit() {
		/* Not good - this subscription method is called even when the form is being destroyed */
		/* this.form.control.valueChanges
		  .subscribe(values => {
			this.projectService.connection.verified = false;
			this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
		  });
		*/
	}
	resetConnectionVerified() {
		this.projectService.connection.verified = false;
		this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
	}
	ngOnInit() {
	}
}

