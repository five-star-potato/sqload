import * as d3 from 'd3';
import { Component, NgZone, ElementRef, Renderer } from "@angular/core";
import { Router } from '@angular/router';
import { BaseComponent } from "./base.component";
import { TRON_GLOBAL, TRON_EVENT, OBJ_TYPE } from './constants';
import { DataGenerator, fnGetDataTypeDesc, fnGetCleanName } from './include';
import * as gen from './generator/generators.component';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { ColumnDef, DBObjDef, ProjectService } from "./service/project";
import { CommandOutputGenerator } from "./generator/generators.component";

@Component({
    template: `	
        <div class="flexbox-parent">
               <canvas id="hdnCanvas" style="display:none"></canvas>
               <div class="flexbox-item header">
                <h3>Set up the number of rows to be generated</h3>
            </div>
            <div class="flexbox-item fill-area content flexbox-item-grow" style="overflow-x:auto;overflow-y:auto" id="divFlow">
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
    svgContainer: any;
    merged: DBObjDef[];

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService,
        public el: ElementRef, public renderer: Renderer) {
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
    private getTextWidth(text, fontSize, fontFace): number {
        let a: any = document.getElementById('hdnCanvas');
        let b: any = a.getContext('2d');
        b.font = fontSize + 'px ' + fontFace;
        return b.measureText(text).width;
    }
    private drawHeader() {
        this.svgContainer = d3.select("#divFlow").append("svg")
            .attr("width", 2000)
            .attr("height", 2000);

        this.svgContainer.append("svg:defs").append("svg:marker")
            .attr("id", "triangle")
            .attr("refX", 6)
            .attr("refY", 6)
            .attr("markerWidth", 30)
            .attr("markerHeight", 30)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 12 6 0 12 3 6")
            .style("fill", "orange");

        this.svgContainer.append("text")
            .attr("x", 10)
            .attr("y", 10)
            .attr("color", "#888")
            .text("Sequence");
        this.svgContainer.append("text")
            .attr("x", 100)
            .attr("y", 10)
            .attr("color", "#888")
            .text("Group");
        this.svgContainer.append("text")
            .attr("x", 200)
            .attr("y", 10)
            .attr("color", "#888")
            .text("Database Object");
        this.svgContainer.append("line")
            .attr("x1", 10)
            .attr("y1", 15)
            .attr("x2", 1600)
            .attr("y2", 15)
            .attr("stroke", "#DDD")
            .attr("strok-width", 1);
    }
    private drawFlow() {
        let colBtnHeight: number = 25;
        this.merged = [];
        Object.keys(this.objects).forEach(objType => this.merged = this.merged.concat(this.objects[objType]));
        this.merged.sort((a, b) => a.sequence - b.sequence);
        // find width of the object with the longest name
        let maxObjWidth: number = Math.max.apply(Math, this.merged.map(m => this.getTextWidth(m.name, 12, "arial"))) + 20;
        let maxY = this.merged.length * 80; // calculate the upperbound of rangeRound.
        let yband = d3.scaleBand().rangeRound([20, maxY]).domain(this.merged.map(m => m.name));

        let selection = this.svgContainer.selectAll(".selectedObjs")
            .data(this.merged)
            .enter();
        let sx: number = 200;
        // the rectangle and text display for each selected object
        selection.append('rect')
            .attr('rx', 5)
            .attr('ry', 5)
            .attr("x", d => { d.x = sx + maxObjWidth; return sx; }) // set up the connection point origin
            .attr("y", d => { d.y = yband(d.name) + 15; return yband(d.name); })
            .attr("width", maxObjWidth)
            .attr("height", 30)
            .style("fill", '#AAA');
        selection.append('text')
            .attr("x", sx + 10)
            .attr("y", d => yband(d.name) + 20)
            .attr("fill", "#fff")
            .style("stroke-width", 1)
            .style("font-size", "12px")
            .style("font-family", "arial")
            .style("text-anchor", "start")
            .text(d => d.name);

        // HTML elements are wrapped inside foreignObject
        let fo1 = selection.append("foreignObject")
            .attr("x", sx - 170)
            .attr("y", d => yband(d.name))
            .attr("width", 120)
            .attr("height", 20);
        let div1 = fo1.append("xhtml:div")
            .append("div")
            .style("position", "relative")
            .html((d, i) =>
                `<button id="btnUp_${i}" data-index='${i}' class="btn btn-xs btn-info" style="position:absolute; top:3px;">
                        <i id="iconUp_${i}" data-index='${i}' class="fa fa-arrow-up" aria-hidden="true"></i></button>
                     <button id="btnDown_${i}" data-index='${i}' class="btn btn-xs btn-info" style="position:absolute; top:3px; left:30px">
                        <i id="iconDown_${i}" data-index='${i}' class="fa fa-arrow-down" aria-hidden="true"></i></button>
                     <input id="chkInclude_${i}" style="position:absolute; left:100px; top:5px" class="flowChkGrouping" type="checkbox">`);
        fo1.each(r => {
            let cx: number = 10;
            let id = r.id;
            //console.log(id);
            //console.log(this.projectService.columnDefs[id]);
            var colors = this.svgContainer
                // for all the columns that are to be wired from previous commands, lay them out as buttons
                .selectAll('.columnDefs')
                .data(this.projectService.columnDefs[id].filter(d => {
                    if (d.plugIn.length > 0 && d.plugIn[0].constructor.name == "CommandOutputGenerator")
                        return true;
                    return false;
                }))
                .enter().append("foreignObject")
                .attr('x', d => {
                    let x1 = cx;
                    let x2 = sx + maxObjWidth + 10 + x1;
                    let w = this.getTextWidth(d.name, 10, "arial");
                    d.x = x2 + w / 2;
                    cx += (30 + w);
                    return x2;
                })
                .attr('y', d => { let y = yband(r.name) + 3; d.y = y; return y; })
                .attr('width', d => this.getTextWidth(d.name, 10, "arial"))
                .attr('height', colBtnHeight)
                .html(d => `<button id="btnMap_${fnGetCleanName(d.name)}" class="btn btn-xs btn-primary flowBtnColumn">${d.name}</button>`);

        });

        // draw connection lines
        let lineFactory = d3.line().curve(d3.curveBasis);
        for (let dbObj of this.merged) {
            let cols = this.projectService.columnDefs[dbObj.id];
            for (let col of cols.filter(c => { return (c.plugIn.length > 0 && c.plugIn[0].constructor.name == "CommandOutputGenerator") })) {
                let cmdGen: CommandOutputGenerator = col.plugIn[0] as CommandOutputGenerator;
                let srcObj = this.merged.find(obj => (obj.id == cmdGen.commandObjectId));
                let points_a = [[srcObj.x, srcObj.y], [(srcObj.x + col.x) / 2 * 1.08, (srcObj.y + col.y) / 2],
                [col.x, srcObj.y > col.y ? col.y + colBtnHeight + 3: col.y - 3]];

                this.svgContainer.append('path')
                    .datum(points_a)
                    .attr('d', lineFactory)
                    .attr('fill', 'none')
                    .attr('stroke', 'orange')
                    .attr('marker-end', 'url(#triangle)');
            }
        }
    }
    private redrawObjects() {
        d3.select("svg").remove();
        this.drawHeader();
        this.drawFlow();
    }
    ngOnInit() {
        this.renderer.listenGlobal("body", "click", (e) => {
            this.ngZone.run(() => {
                console.log('event hit');
                console.log(e.target.id);
                if (e.target.id.startsWith("btnDown_") || e.target.id.startsWith("iconDown_")) {
                    let i: number = +$(e.target).data("index"); // force it number
                    if (i < this.merged.length - 1) {
                        let obj1: DBObjDef = this.merged[i];
                        let obj2: DBObjDef = this.merged[i + 1];
                        [obj1.sequence, obj2.sequence] = [obj2.sequence, obj1.sequence];
                    }
                    this.redrawObjects();
                }
                if (e.target.id.startsWith("btnUp_") || e.target.id.startsWith("iconUp_")) {
                    let i: number = +$(e.target).data("index"); // force it number
                    if (i > 0) {
                        let obj1: DBObjDef = this.merged[i];
                        let obj2: DBObjDef = this.merged[i - 1];
                        [obj1.sequence, obj2.sequence] = [obj2.sequence, obj1.sequence];
                    }
                    this.redrawObjects();
                }
            });
        });

        this.objects = this.projectService.selectedObjs;
        this.drawHeader();
        this.drawFlow();

        this.sequenceObj = this.getAllObjects();
    }
}