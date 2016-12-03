import { Component, OnInit, NgZone } from '@angular/core';
import { Router } from '@angular/router';
import { TRON } from "./constants";
import { BaseComponent } from './base.component';

@Component({
  template: `
  <div class="flexbox-parent">
    <div class="flexbox-item fill-area content flexbox-item-grow" style="flex-direction:column">
      <div class="col-md-8">
          <div class="form-group">
            <label>Server Name</label> <input type="text" [(ngModel)]="serverName" class="form-control" placeholder="Server" />
          </div>

          <div class="form-group">
            <label>User Name</label> <input type="text" [(ngModel)]="databaseName" class="form-control" placeholder="Database Name" />
          </div>

          <div class="form-group">
            <label>User Name</label> <input type="text" [(ngModel)]="userName" class="form-control" placeholder="User Name" />
          </div>

          <div class="form-group">
            <label>Password</label> <input type="password" [(ngModel)]="password" class="form-control" placeholder="Password" />
          </div>
        </div>
    </div>

    <div class="flexbox-item footer">
      <button class='btn btn-primary nav-btn' (click)="next()">Connect</button>
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
