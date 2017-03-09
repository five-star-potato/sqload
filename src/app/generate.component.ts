import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON_GLOBAL, TRON_EVENT, NAME_TYPE, OBJ_TYPE, COL_DIR_TYPE, WORKER_MSG_TYPE, DIALOG_MSG_TYPE } from './constants';
import { BaseComponent } from './base.component';
import { fnGetDataTypeDesc, fnStringifyNoCircular, fnGetCleanName, WorkerMessage, ProgressData } from './include';
import { SampleAddressGenerator, GivenNameGenerator, SurnameGenerator, IntegerGenerator, TextGenerator, DateGenerator, UUIDGenerator, CustomSqlGenerator, CustomValueGenerator, FKGenerator } from './generator/generators.component';
import { WizardStateService } from "./service/wizard-state";
import { ColumnDef, DBObjDef,  ProjectStruct } from "./project-def";
import { ProjectService } from './service/project-service';
declare var require: (moduleId: string) => any;
var appConf = require('../app.conf');

@Component({
    template: `	
        <div class="flexbox-parent">
            <div class="flexbox-item header">
                <h3>Generate Data</h3>
            </div>
            
            <div class="flexbox-item fill-area content flexbox-item-grow">
                <div class="fill-area-content flexbox-item-grow" style="display:flex; flex-direction:row; padding: 5px">
                    <div style="display:flex; flex-direction:column; width:100%">
                        <p>Overall Progress <span class="blink_me progress_msg">{{progressMsg}}</span></p>
                        <div class="progress">
                            <div class="progress-bar progress-bar-striped active" role="progressbar"
                            aria-valuenow="40" aria-valuemin="0" aria-valuemax="100" [style.width]="overallProgress + '%'">
                                {{ overallProgress }}%
                            </div>
                        </div>
                        <table class="table" >
                            <thead>
                                <tr>
                                    <th>Table</th>
                                    <th>Target # of Rows</th>
                                    <th>Progress</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr *ngFor="let p of progress">
                                    <td>{{p.name}}</td>
                                    <td>{{p.targetRows.toLocaleString()}}</td>
                                    <td>
                                        <div class="progress">
                                        <div class="progress-bar progress-bar-warning" role="progressbar" [style.width]="p.percent + '%'">
                                            {{ p.percent }}%
                                        </div>
                                        </div>                          
                                   </td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
            
            <div class="flexbox-item footer">
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="back()">Back</button>
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="next()">Generate Data</button>
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="saveProject()">Save Project</button>
            </div>
        </div>

<div class="modal fade" id="modalMsgBox" tabindex="-1" role="dialog" aria-labelledby="">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title">SQL Scripts</h4>
         All SQL scripts are saved in this directory:<br>

    <div class="input-group">
      <input id="scriptPath" type="text" class="form-control" value="{{modalMsg}}">
      <span class="input-group-btn">
        <button data-clipboard-target="#scriptPath" class="btn btnCopyText btn-secondary" type="button"><i class="fa fa-files-o" aria-hidden="true"></i></button>
      </span>
    </div>
         You can modify the output directory in <span style='font-style:italic'>app.config.js</span> file
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div>
  </div>
</div>
        
    `,
    styleUrls: [
        './css/host.css'
    ],
    styles: [
        `
            .progress_msg {
                float:right;
                /* margin-left: 20px; */
            }
            .blink_me {
                animation: blinker 1s linear infinite;
            }

            @keyframes blinker {  
                50% { opacity: 0; }
            }        
        `
    ]
})
export class GenerateComponent extends BaseComponent {
    stmts: string[] = [];
    declareStmts: string[] = [];
    allObjects: DBObjDef[];
    progress: ProgressData[] = [];
    overallProgress: number = 0;
    totalRowCnt: number = 0;
    runningRowCnt: number = 0;
    sampleAdresses = {}; // the assoc array will be { key:  region-country }, values:[] }
    sampleNames = {};    
    modalTitle: string;
    modalMsg: string;
    
    progressMsg: string = "";
    lineCount: number = 0;
    //fileSubDir: string;

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, projectService: ProjectService) {
        super(router, ngZone, wizardStateService, projectService);
    }
    private cleanUnusedPlugin() {
        var tbls = this.projectService.selectedObjs['U'];
        tbls.forEach(t => {
            // trim unused plugin; cf.plugins is a list of plugins; only the first one is used. The rest are for users to undo changes only
            this.projectService.project.getAllColumnsByObjIdInst(t.id, t.instance).forEach((cf: ColumnDef) => {
                if (cf.plugIn.length > 1)
                    cf.plugIn.splice(1);
            });
        });
    }
    private generateData() {
        let dt = new Date();
        let fileSubDir:string = dt.toISOString().replace(/\.\d+/,'').replace(/:/g,'');
        this.cleanUnusedPlugin();
        var worker = new Worker("../renderer.bundle.js");
        worker.onmessage = event => {
            this.ngZone.run(() => {
                //console.log("received msg:");
                //console.log(event);
                let msg:WorkerMessage = event.data as WorkerMessage;
                switch (msg.msgType) {
                    case WORKER_MSG_TYPE.OUTPUT:
                        let msgData:any = msg.data;
                        setTimeout(() => {
                            this.progress[this.progress.length - 1].percent = msgData.percent * 100;
                            this.overallProgress = msgData.overallProgress * 100;
                            this.fnWriteSqlToFile(fileSubDir, this.projectService.connection, fnGetCleanName(msgData.name), msgData.rows, msgData.stmts);
                        },0);
                        break;
                    case WORKER_MSG_TYPE.RENDER_ERR:
                        alert(msg.data);
                        break;
                    case WORKER_MSG_TYPE.RENDER_PROGRESS:
                        let progData: ProgressData = msg.data as ProgressData;
                        setTimeout(() => {
                            this.progress.push(progData);
                        }, 0);
                        break;
                    case WORKER_MSG_TYPE.GET_SAMPLE_ADDR_START:
                        this.progressMsg = "Fetching sample addresses";
                        break;
                    case WORKER_MSG_TYPE.GET_SAMPLE_ADDR_END:
                        this.progressMsg = "";
                        break;
                    case WORKER_MSG_TYPE.GET_SAMPLE_NAME_START:
                        this.progressMsg = "Fetching sample names";
                        break;
                    case WORKER_MSG_TYPE.GET_SAMPLE_NAME_END:
                        this.progressMsg = "";
                        break;
                    case WORKER_MSG_TYPE.DONE:
                        this.wizardStateService.hideSpinning();
                        this.progressMsg = "Data generation is finished";
                        this.modalTitle = "SQL Scripts Generated";
                        this.modalMsg = appConf.options.sqlOutputDir + "/" + fileSubDir;
                        jQuery("#modalMsgBox").modal();
                        break;
                }
            });
        }
        worker.postMessage(new WorkerMessage({ msgType: WORKER_MSG_TYPE.RENDER, data: this.projectService.project }));        
        this.stmts = [];
        this.progress = [];
        this.progressMsg = "";
    }
    back() {
        this.router.navigate(['/flow']);
    }
    next() {
        this.wizardStateService.showSpinning("generate");
        this.preprocessing();
        this.generateData();
    }
    private preprocessing() {
        // do some house cleaning here
        this.cleanUnusedPlugin();
        this.projectService.groups.forEach(g => {
            this.projectService.project.sortGroupMember(g)
        });
    }
    private async saveProject() {
        /*
            let somePromises = [1, 2, 3, 4, 5].map(n => Promise.resolve(n));
            let resolvedPromises = await Promise.all(somePromises);
        */
        this.preprocessing();
        let projectContent = fnStringifyNoCircular(this.projectService);
        this.fnSaveProject(projectContent);
    }
    ngOnInit() {
        this.allObjects = this.projectService.project.getAllObjects();
        this.allObjects.sort((a, b) => a.sequence - b.sequence);
    }
}