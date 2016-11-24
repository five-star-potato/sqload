import { NgModule, ModuleWithProviders }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent }  from './app.component';
import { HomeComponent }  from './home.component';
import { ConnectionComponent }  from './connection.component';
import { FormsModule }   from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';

const appRoutes: Routes = [
  { path: '', component: HomeComponent },
  { path: 'connect', component: ConnectionComponent },
];

@NgModule({
  imports:      [ BrowserModule, FormsModule, RouterModule.forRoot(appRoutes) ],
  declarations: [ AppComponent, ConnectionComponent, HomeComponent ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { 
}