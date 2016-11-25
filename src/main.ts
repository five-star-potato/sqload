declare var require:(moduleId:string) => any;
require('script!jquery/dist/jquery.min.js');
require('script!tether/dist/js/tether.min.js');
require("bootstrap");

import "core-js";
import "reflect-metadata";
import "zone.js/dist/zone";
import { platformBrowserDynamic } from '@angular/platform-browser-dynamic';
import { AppModule } from './app/app.module';

const platform = platformBrowserDynamic();
platform.bootstrapModule(AppModule);