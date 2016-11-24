import { Component, OnInit, NgZone } from '@angular/core';

declare var electron: any;

@Component({
    template: `
    <div class="container page2">
      <div class="row">
        <div class="col-md-12">
          <div class="form-group">
            <label>Server Name</label>
            <input type="text" class="form-control" [(ngModel)]="serverName" placeholder="Server">
          </div>
          <div class="form-group">
            <label>User Name</label>
            <input type="text" class="form-control" [(ngModel)]="databaseName" placeholder="Database Name">
          </div>
          <div class="form-group">
            <label>User Name</label>
            <input type="text" class="form-control" [(ngModel)]="userName" placeholder="User Name">
          </div>
          <div class="form-group">
            <label>Password</label>
            <input type="password" class="form-control" [(ngModel)]="password" placeholder="Password">
          </div>
        </div>
      </div>
    
      <div class="row">
        <div class="col-md-12">
          <button class='btn btn-primary'>Connect</button>
        </div>
      </div>
      <p>Sample Data 9</p>
      <p>{{serverName}}</p>
      <p>{{dataSet.length}}</p>
      
      <table>
        <tr *ngFor="let dr of dataSet">
            <td *ngFor="let dc of dr">
                <span>{{dc.value}}</span>
            </td>
        </tr>
      </table>            
    </div>
    `,
    styles: [`
    `]
})
export class ConnectionComponent implements OnInit {
    serverName: string;
    userName: string;
    password: string;
    databaseName: string;
    dataSet: any[] = [];

    constructor(private _ngZone: NgZone) {
    }
    ngOnInit() {
        //electron.ipcRenderer.send("message");
        var remote = electron.remote;
        this.serverName = remote.getGlobal('serverName'); 
        this.databaseName = remote.getGlobal('databaseName'); 
        this.userName = remote.getGlobal('userName'); 
        this.password = remote.getGlobal('password'); 

        let dataSet = remote.getGlobal('fnExecSQL')("SELECT top 10 * from Person.Person ",
            (err, res) => {
                this._ngZone.run(() => {
                    console.log("inside fnExecSQL callback");
                    this.dataSet = res;
                    console.log(this.dataSet);
                });
            }
        );
        /*
                console.log("err = " + err);
                res.forEach((ds) => {
                  console.log("-----------------------------------");
                  ds.forEach((col) => {
                    console.log("column: " + col.name);
                    console.log("value: " + col.value);
                  })
                });
        */
    }
}