import { NgModule, ModuleWithProviders }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
import { AppComponent }  from './app.component';
import { ConnectionComponent }  from './connection.component';
import { HomeComponent }  from './home.component';
import { ColumnsComponent }  from './columns.component';
import { GenerateComponent }  from './generate.component';
import { TablesComponent }  from './tables.component';
import { RowsComponent }  from './rows.component';
import { RouterModule, Routes } from '@angular/router';
import { selectedObjectsPipe } from './pipes.component';
import { OrderBy } from './orderby.component';
import { WizardStateService } from "./service/wizard-state";

const appRoutes: Routes = [
  // don't do: { path: 'home', component: HomeComponent },
  // the above statement won't trigger the routerLinkActive directive 
  { path: "", redirectTo: "home", pathMatch: "full" },  
  { path: 'home', component: HomeComponent },
  { path: 'connect', component: ConnectionComponent },
  { path: 'tables', component: TablesComponent },
  { path: 'generate', component: GenerateComponent },
  { path: 'columns', component: ColumnsComponent },
  { path: 'rows', component: RowsComponent }
];

@NgModule({
  imports:      [ BrowserModule, FormsModule, RouterModule.forRoot(appRoutes) ],
  declarations: [ AppComponent, ConnectionComponent, HomeComponent, TablesComponent, ColumnsComponent, RowsComponent, GenerateComponent, selectedObjectsPipe, OrderBy ],
  providers:    [ WizardStateService ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { 
}