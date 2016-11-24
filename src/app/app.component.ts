import { Component } from "@angular/core";
import { Router } from "@angular/router"

@Component({
    selector: 'my-app',
    template: `	
    <div class="container-fluid">
        <div class="row">
            <div class="col-md-12">
                <router-outlet></router-outlet>
            </div>
        </div>
    </div>
`    
})
export class AppComponent {}