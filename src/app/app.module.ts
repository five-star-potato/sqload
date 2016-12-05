import { NgModule, ModuleWithProviders }      from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent }  from './app.component';
import { ConnectionComponent }  from './connection.component';
import { HomeComponent }  from './home.component';
import { ColumnsComponent }  from './columns.component';
import { GenerateComponent }  from './generate.component';
import { TablesComponent }  from './tables.component';
import { RowsComponent }  from './rows.component';
import { FormsModule }   from '@angular/forms';
import { RouterModule, Routes } from '@angular/router';
import { selectedObjectsPipe } from './pipes.component';
import { OrderBy } from './orderby.component';

const appRoutes: Routes = [
  { path: '', component: HomeComponent },
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
  bootstrap:    [ AppComponent ]
})
export class AppModule { 
}