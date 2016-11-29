import { Component } from "@angular/core";
import { Router } from "@angular/router"

@Component({
    selector: 'my-app',
    template: `
    <div class="container-fluid" style="height:100%; margin: 0 auto">
        <router-outlet></router-outlet>
    </div>
    `    
})
export class AppComponent {}