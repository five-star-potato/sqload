import { Component } from "@angular/core";

@Component({
    template: `	
        <div class="flexbox-parent">
            <div class="flexbox-item header">
                <h1>Welcome</h1>
            </div>
            
            <div class="flexbox-item fill-area content flexbox-item-grow">
                <div class="fill-area-content flexbox-item-grow">
                    
                    <br /><br />
                    Data generation tool for SQL Server
<br>
<!-- Button trigger modal -->
<button type="button" class="btn btn-primary btn-lg" data-toggle="modal" data-target="#myModal">
  Launch demo modal
</button>

                    <br /><br />      
                </div>
            </div>
            
            <div class="flexbox-item footer">
                <a routerLink="/connect" class="btn btn-lg btn-primary">Getting Started</a>
            </div>
        </div>


<!-- Modal -->
<div class="modal fade" id="myModal" tabindex="-1" role="dialog" aria-labelledby="myModalLabel" aria-hidden="true">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close">
          <span aria-hidden="true">&times;</span>
        </button>
        <h4 class="modal-title" id="myModalLabel">Modal title</h4>
      </div>
      <div class="modal-body">
        ...
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-secondary" data-dismiss="modal">Close</button>
        <button type="button" class="btn btn-primary">Save changes</button>
      </div>
    </div>
  </div>
</div>        
    `,
    styles: [`
    `]
})
export class HomeComponent {}