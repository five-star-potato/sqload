import { Component } from "@angular/core";

@Component({
    template: `	
    <div class="container-fluid page1">
        <div class="row">
            <div class="col-md-12">
                <h1>Welcome</h1>
                    <a routerLink="/connect" class="btn btn-lg btn-primary">Getting Started</a>
            </div>
        </div>
    </div>
    `,
    styles: [`
    }`]
})
export class HomeComponent {}