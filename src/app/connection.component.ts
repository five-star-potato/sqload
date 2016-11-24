import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON } from "./constants";
import { BaseComponent } from './base.component';

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
          <button class='btn btn-primary' (click)="next()">Connect</button>
        </div>
      </div>
    </div>
    `,
    styles: [`
    `]
})
export class ConnectionComponent extends BaseComponent implements OnInit {
    serverName: string;
    userName: string;
    password: string;
    databaseName: string;
    dataSet: any[] = [];

    constructor(router: Router, ngZone: NgZone) {
      super(router, ngZone);
    }
    next() {
        this.getGlobal(TRON.connection).serverName = this.serverName;
        this.getGlobal(TRON.connection).databaseName = this.databaseName;
        this.getGlobal(TRON.connection).userName, this.userName;
        this.getGlobal(TRON.connection).password = this.password;
        this.router.navigate(['/tables']);
    }
    ngOnInit() {
        //electron.ipcRenderer.send("message");
        console.log("ServerName");
        console.log(this.getGlobal(TRON.connection));

        this.serverName = this.getGlobal(TRON.connection).serverName;
        this.databaseName = this.getGlobal(TRON.connection).databaseName;
        this.userName = this.getGlobal(TRON.connection).userName;
        this.password = this.getGlobal(TRON.connection).password;
    }
}
