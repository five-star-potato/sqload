import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON } from "./constants";
import { BaseComponent } from './base.component';

@Component({
  template: `
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
  back() { }
  next() {
    this.getGlobal().connection.serverName = this.serverName;
    this.getGlobal().connection.databaseName = this.databaseName;
    this.getGlobal().connection.userName, this.userName;
    this.getGlobal().connection.password = this.password;
    this.router.navigate(['/tables']);
  }
  ngOnInit() {
    //electron.ipcRenderer.send("message");

    this.serverName = this.getGlobal().connection.serverName;
    this.databaseName = this.getGlobal().connection.databaseName;
    this.userName = this.getGlobal().connection.userName;
    this.password = this.getGlobal().connection.password;
  }
}
