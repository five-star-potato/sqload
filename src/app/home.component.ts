import { Component } from "@angular/core";

@Component({
    template: `	
    <div class="flexbox-parent">
        <div class="flexbox-item header">
            <h1>Welcome</h1>
        </div>
        
        <div class="flexbox-item fill-area content flexbox-item-grow">
            <div class="fill-area-content flexbox-item-grow">
                Content 
                <br /><br />
                Emulates height 100% with a horizontal flexbox with stretch
                <br /><br />      
                This box with a border should fill the blue area except for the padding (just to show the middle flexbox item).
            </div>
        </div>
        
        <div class="flexbox-item footer">
            <a routerLink="/connect" class="btn btn-lg btn-primary">Getting Started</a>
        </div>
    </div>
    `,
    styles: [`
	.flexbox-parent
	{
		width: 100%;
		height: 100%;

		display: flex;
		flex-direction: column;
		
		justify-content: flex-start; /* align items in Main Axis */
		align-items: stretch; /* align items in Cross Axis */
		align-content: stretch; /* Extra space in Cross Axis */
				
		background: rgba(255, 255, 255, .1);
	}

	.flexbox-item
	{
		padding: 8px;
	}
	.flexbox-item-grow
	{
		flex: 1; /* same as flex: 1 1 auto; */
	}

	.flexbox-item.header
	{
		background: rgba(255, 0, 0, .1);
	}
	.flexbox-item.footer
	{
		background: rgba(0, 255, 0, .1);
	}
	.flexbox-item.content
	{
		background: rgba(0, 0, 255, .1);
	}

	.fill-area
	{
		display: flex;
		flex-direction: row;
		
		justify-content: flex-start; /* align items in Main Axis */
		align-items: stretch; /* align items in Cross Axis */
		align-content: stretch; /* Extra space in Cross Axis */
		
	}
	.fill-area-content
	{
		background: rgba(0, 0, 0, .3);
		border: 1px solid #000000;
		
		/* Needed for when the area gets squished too far and there is content that can't be displayed */
		overflow: auto; 
	}

    `]
})
export class HomeComponent {}