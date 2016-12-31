declare var require:(moduleId:string) => any;
require('jquery');
require('bootstrap');

import "reflect-metadata";
import "zone.js/dist/zone";
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

const platform = platformBrowserDynamic();
platform.bootstrapModule(AppModule);