import * as d3 from 'd3';
import { Component, NgZone, ElementRef } from "@angular/core";
import { Router } from '@angular/router';
import { BaseComponent } from "./base.component";
import { TRON_GLOBAL, TRON_EVENT, OBJ_TYPE } from './constants';
import { DataGenerator, fnGetDataTypeDesc } from './include';
import * as gen from './generator/generators.component';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { ColumnDef, DBObjDef, ProjectService } from "./service/project";

@Component({
    template: `	
        <div class="flexbox-parent">
               <div class="flexbox-item header">
                <h3>Set up the number of rows to be generated</h3>
            </div>
            <div class="flexbox-item fill-area content flexbox-item-grow" style="overflow-y:auto" id="divFlow">
            </div>
            
            <div class="flexbox-item footer">
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="back()">Back</button>
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="next()">Next</button>
            </div>
        </div>
    `,
    styleUrls: [
        './css/host.css'
    ],
    styles: [
        `
        .object-sup-tag {
            font-size:10px;
        }
        `
    ]
})
export class WorkflowComponent extends BaseComponent {
    objects: { [objType: string]: DBObjDef[] };
    sequenceObj: DBObjDef[];

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService, public el: ElementRef) {
        super(router, ngZone, wizardStateService, dataService, projectService);
    }
    private moveUp(index: number) {
        var b = this.sequenceObj[index].sequence;
        this.sequenceObj[index].sequence = this.sequenceObj[index - 1].sequence;
        this.sequenceObj[index - 1].sequence = b;
    }
    private moveDown(index: number) {
        var b = this.sequenceObj[index].sequence;
        this.sequenceObj[index].sequence = this.sequenceObj[index + 1].sequence;
        this.sequenceObj[index + 1].sequence = b;
    }

    back() {
        this.router.navigate(['/columns']);
    }
    next() {
        this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
        this.router.navigate(['/generate']);
    }
    private drawFlow(objs: { [objType:string]: DBObjDef[]}) {
        let svgContainer = d3.select("#divFlow").append("svg")
            .attr("width", 2000)
            .attr("height", 2000);

        let merged:DBObjDef[] = [];
        Object.keys(this.objects).forEach(objType => merged = merged.concat(objs[objType]));
        merged.sort(m => m.sequence);
        let maxY = merged.length * 60;
        let yband = d3.scaleBand().rangeRound([10, maxY]).domain(merged.map(m => m.name));

        let selection = svgContainer.selectAll(".selectedObjs")
            .data(merged)
            .enter();
        let sx:number = 200;
        // the rectangle and text display for each selected object
        selection.append('rect')
            .attr('rx', 5)
            .attr('ry', 5)
            .attr("x", sx)
            .attr("y", d => yband(d.name))
            .attr("width", 300)
            .attr("height", 30)
            .style("fill", '#AAA');
        selection.append('text')
            .attr("x", sx + 10)
            .attr("y", d => yband(d.name) + 20)
            .attr("fill","#fff")
            .style("stroke-width", 1)
            .style("font-size", "12px")
            .style("text-anchor", "start")
            .text(d => d.name);

        let fo1 = selection.append("foreignObject")
            .attr("x", sx - 20)
            .attr("y", d => yband(d.name) + 7)
            .attr("width", 20)
            .attr("height", 20);
        let div1 = fo1.append("xhtml:div")
            .append("div")
            .html('<input type="checkbox">');
        fo1.each(r => {
            let id = r.id;
            console.log(id);
            console.log(this.projectService.columnDefs[id]);
            var colors = svgContainer
                    .selectAll('.columnDefs')
                    .data(this.projectService.columnDefs[id])
                    .enter().append('rect')
                    .attr('x', 800)
                    .attr('y', d => yband(r.name))
                    .attr('width', 40)
                    .attr('height', 20)
                    .attr('fill', "teal");

        });
/*
        let fo2 = selection.append("foreignObject")
            .attr("x", sx - 20)
            .attr("y", d => yband(d.name) + 7)
            .attr("width", 20)
            .attr("height", 20);
        let div2 = fo2.append("xhtml:div")
            .append("div");
        div2.append("div")
            .data(d2 => this.projectService.columnDefs[d2["id"]])
            .html('<button>test</button>');
*/
    }
    ngOnInit() {
        this.objects = this.projectService.selectedObjs;
        this.drawFlow(this.objects);

        this.sequenceObj = this.getAllObjects();
    }
}