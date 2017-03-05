import { NgModule, ModuleWithProviders } from '@angular/core';
import { HttpModule } from '@angular/http';
import { BrowserModule } from '@angular/platform-browser';
import { FormsModule }   from '@angular/forms';
import { AppComponent }  from './app.component';
import { ConnectionComponent }  from './connection.component';
import { HomeComponent }  from './home.component';
import { ColumnsComponent }  from './columns.component';
import { GenerateComponent }  from './generate.component';
import { ObjectsComponent }  from './objects.component';
import { FlowComponent }  from './flow.component';
import { RouterModule, Routes } from '@angular/router';
import { selectedObjectsPipe } from './pipes.component';
import { OrderBy } from './orderby.component';
import { WizardStateService } from "./service/wizard-state";
import { ProjectService } from "./service/project-service";
import { SampleAddressConfigComponent } from "./sample-address-config.component";

const appRoutes: Routes = [
  // don't do: { path: 'home', component: HomeComponent },
  // the above statement won't trigger the routerLinkActive directive 
  { path: "", redirectTo: "home", pathMatch: "full" },  
  { path: 'home', component: HomeComponent },
  { path: 'connect', component: ConnectionComponent },
  { path: 'objects', component: ObjectsComponent },
  { path: 'generate', component: GenerateComponent },
  { path: 'columns', component: ColumnsComponent },
  { path: 'flow', component: FlowComponent }
];

@NgModule({
  imports:      [ BrowserModule, FormsModule, RouterModule.forRoot(appRoutes), HttpModule ],
  declarations: [ AppComponent, ConnectionComponent, HomeComponent, ObjectsComponent, ColumnsComponent, FlowComponent,  GenerateComponent, selectedObjectsPipe, OrderBy, SampleAddressConfigComponent ],
  providers:    [ WizardStateService, ProjectService ],
  bootstrap:    [ AppComponent ]
})
export class AppModule { 
}