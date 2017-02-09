import * as d3 from 'd3';
import { Component, NgZone, ElementRef, Renderer, OnDestroy } from "@angular/core";
import { Router } from '@angular/router';
import { BaseComponent } from "./base.component";
import { TRON_GLOBAL, TRON_EVENT, OBJ_TYPE, COL_DIR_TYPE } from './constants';
import { DataGenerator, fnGetDataTypeDesc, fnGetCleanName, fnGetLargeRandomNumber } from './include';
import * as gen from './generator/generators.component';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { ColumnDef, DBObjDef, ProjectService, OutputMap } from "./service/project";
import { CommandOutputGenerator } from "./generator/generators.component";
declare var require: (moduleId: string) => any;
var appConf = require('../app.conf');

class OutputMapAttribute {
    dbObjInstance: string;  // this combined objId : instance
    outputName: string;     // this combined dirType : column name
}

@Component({
    template: `	
        <div class="flexbox-parent">
               <canvas id="hdnCanvas" style="display:none"></canvas>
               <div class="flexbox-item header">
                <h3>Configure the flow of data generation</h3>
            </div>
            <div class="flexbox-item fill-area content flexbox-item-grow" style="overflow-x:auto;overflow-y:auto" id="divFlow">
            </div>
            
            <div class="flexbox-item footer">
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="back()">Back</button>
                <button style="margin-top:30px" class='btn btn-primary nav-btn' (click)="next()">Next</button>
            </div>
        </div>

<div class="modal fade" id="modalOutputMapping" tabindex="-1" role="dialog" aria-labelledby="myModalLabel">
  <div class="modal-dialog" role="document">
    <div class="modal-content">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-label="Close"><span aria-hidden="true">&times;</span></button>
        <h4 class="modal-title">Mapping output to input</h4>
      </div>
      <div class="modal-body">
            <div class="form-group">
                <label>Database Object instance</label>
                <select required [ngModel]="outputMapping.dbObjInstance" (ngModelChange)="mappingObjChanged($event)" class="form-control"> 
                    <option *ngFor="let obj of merged" [value]="obj.id + ':' + obj.instance">{{obj.name + ':' + obj.instance}}</option>
                </select>
            </div>
            <div class="form-group">
                <select required [(ngModel)]="outputMapping.outputName" class="form-control"> 
                    <option *ngFor="let col of mappableSourceColumns" [value]="col.dirType + ':' +  col.name">{{ col.dirType + ' - ' + col.name}}</option>
                </select>
            </div>
      </div>
      <div class="modal-footer">
        <button type="button" class="btn btn-primary" [disabled]="checkMappingDisabled()" data-dismiss="modal" (click)="saveOutputMappingChanges()">Save changes</button>
        <button type="button" class="btn btn-default" data-dismiss="modal">Close</button>
      </div>
    </div>
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
        .ng-valid[required], .ng-valid.required  {
        border-left: 5px solid #42A948; /* green */
        }
        .ng-invalid:not(form)  {
        border-left: 5px solid #a94442; /* red */
        }        
        `
    ]
})
export class FlowComponent extends BaseComponent implements OnDestroy {
    globalListenFunc: Function;
    objects: { [objType: string]: DBObjDef[] };
    svgContainer: any;
    merged: DBObjDef[];
    outputMapping: OutputMapAttribute = new OutputMapAttribute();
    mappableSourceColumns: ColumnDef[] = [];
    currColDef: ColumnDef;
    
    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService,
        public el: ElementRef, public renderer: Renderer) {
        super(router, ngZone, wizardStateService, dataService, projectService);
    }
    private mappingObjChanged(value) {
        this.outputMapping.dbObjInstance = value;
        let objId:number, instance:number;
        [objId, instance] = value.split(":").map(Number);
        this.mappableSourceColumns = this.projectService.getMappableSourceColumns(objId, instance);
    }
    private moveUp(index: number) {
        var b = this.merged[index].sequence;
        this.merged[index].sequence = this.merged[index - 1].sequence;
        this.merged[index - 1].sequence = b;
    }
    private moveDown(index: number) {
        var b = this.merged[index].sequence;
        this.merged[index].sequence = this.merged[index + 1].sequence;
        this.merged[index + 1].sequence = b;
    }
    private findExistingOutputMap(objId: number, instance: number, dirType: COL_DIR_TYPE, colName: string): OutputMap {
        let map: OutputMap = this.projectService.outputMaps.find(o => {
            return (o.dbObjectId === objId && o.instance === instance && o.dirType == dirType && o.outputName == colName);
        });
        return map;
    }
    private checkMappingDisabled(): boolean {
        if (this.outputMapping.outputName && this.outputMapping.dbObjInstance)
            return false;
        else
            return true;
    }
    private saveOutputMappingChanges() {
        let newMap: OutputMap;
        let objId: number, instance: number;
        let dirType: COL_DIR_TYPE, colName: string;
        let cmdGen: CommandOutputGenerator = this.currColDef.plugIn[0] as CommandOutputGenerator;
        let oldMap = this.projectService.outputMaps.find(o => (o.id == cmdGen.outputMappingId));

        // the logic is:
        // 1. if we can't find a similar mapping object, create one
        // 2. if found, assign it; increase refCount
        // 3. if colDef is switching map id, the old one needs to decrease refCount
        [objId, instance] = this.outputMapping.dbObjInstance.split(':').map(Number);
        [dirType, colName] = this.outputMapping.outputName.split(':');
        newMap = this.findExistingOutputMap(objId, instance, dirType, colName);
        if (!newMap) {
            newMap = {
                id: fnGetLargeRandomNumber(),
                dbObjectId: objId,
                instance: instance,
                dirType: dirType,
                outputName: colName,
                refCount: 1
            };
            this.projectService.outputMaps.push(newMap);
            cmdGen.outputMappingId = newMap.id;
        }
        else if (cmdGen.outputMappingId != newMap.id) {
            cmdGen.outputMappingId = newMap.id;
            newMap.refCount += 1;
        }

        //reduce refcount of the old one; if refCount dropped to 0, remove it
        if (oldMap && oldMap.id != newMap.id) {
            oldMap.refCount -= 1;
            if (oldMap.refCount <= 0) { // if refCount drops to 0, GC it
                let i = this.projectService.outputMaps.findIndex(o => (o.id == oldMap.id))
                this.projectService.outputMaps.splice(i, 1);
            }
        }
        this.redrawObjects();
    }
    back() {
        this.router.navigate(['/columns']);
    }
    next() {
        this.wizardStateService.projectChange({ type: TRON_EVENT.refresh });
        this.router.navigate(['/generate']);
    }
    private getColumnDirClass(dirType: COL_DIR_TYPE):string {
        switch (dirType) {
            case COL_DIR_TYPE.IN_PARAM:
                return "btn-primary";
            case COL_DIR_TYPE.RSLTSET:
                return "btn-warning";
            case COL_DIR_TYPE.TBLVW_COL:
                return "btn-success";
            case COL_DIR_TYPE.OUT_PARAM:
                return "btn-info";
            default:
                return "btn-default";
        }
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
            .attr("x", 110)
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
        let rightPos: { [objId:number]:number } = {};
        this.merged.sort((a, b) => a.sequence - b.sequence);

        let colBtnHeight: number = 25;
        // find width of the object with the longest name
        let maxObjWidth: number = Math.max.apply(Math, this.merged.map(m => this.getTextWidth(m.name, 12, "arial"))) + 20;
        maxObjWidth = Math.max(maxObjWidth, 300);
        let maxY = this.merged.length * 120; // calculate the upperbound of rangeRound.
        // yband to calculate the y position for each dbobject, using id as a marker
        let yband = d3.scaleBand().rangeRound([40, maxY]).domain(this.merged.map(m => String(m.id)));

        let selection = this.svgContainer.selectAll(".selectedObjs")
            .data(this.merged)
            .enter();
        let sx: number = 200;
        // the rectangle and text display for each selected object
        // This is the small label in the topleft
        selection.append('rect')
            .attr('rx', 2)
            .attr('ry', 2)
            .attr("x", sx + 5) // set up the connection point origin
            .attr("y", d => yband(d.id) - 13)
            .attr("width", 94)
            .attr("height", 15)
            .style("fill", d => {
                switch (d.objType) {
                    case OBJ_TYPE.TB:
                        return "DarkSeaGreen";
                    case OBJ_TYPE.VW:
                        return "Salmon";
                    case OBJ_TYPE.SP:
                        return "CornflowerBlue";
                    case OBJ_TYPE.SQL:
                        return "Goldenrod";
                }
            });
        // this is the word TABLE, VIEW, ...
        selection.append('text')
            .attr("x", sx + 11)
            .attr("y", d => yband(d.id) - 3)
            .style("fill", "#fff")
            .style("stroke-width", 1)
            .style("font-size", "10px")
            .style("font-family", "arial")
            .style("text-anchor", "start")
            .text(d => this.getObjectTypeName(d.objType));

        // this is the main shape of the DB object
        selection.append('rect')
            .attr('rx', 5)
            .attr('ry', 5)
            .attr("x", d => { d.x = sx + maxObjWidth; return sx; }) // set up the connection point origin
            .attr("y", d => { d.y = yband(d.id) + 15; return yband(d.id); })
            .attr("width", maxObjWidth)
            .attr("height", 30)
            .style("fill", '#FFF')
            .style("stroke", '#888');
        // DB Object label
        selection.append('text')
            .attr("x", sx + 10)
            .attr("y", d => yband(d.id) + 20)
            .style("fill", "#888")
            .style("stroke-width", 1)
            .style("font-size", "12px")
            .style("font-family", "arial")
            .style("text-anchor", "start")
            .text(d => d.name);

        // HTML elements are wrapped inside foreignObject
        let fo1 = selection.append("foreignObject")
            .attr("x", sx - 170)
            .attr("y", d => yband(d.id))
            .attr("width", 120)
            .attr("height", d => d.height = 20);
        let div1 = fo1.append("xhtml:div")
            .append("div")
            .style("position", "relative")
            .html((d, i) =>
                `<button id="btnUp_${i}" data-index='${i}' class="btn btn-xs btn-info" style="position:absolute; top:3px;">
                        <i id="iconUp_${i}" data-index='${i}' class="fa fa-arrow-up" aria-hidden="true"></i></button>
                     <button id="btnDown_${i}" data-index='${i}' class="btn btn-xs btn-info" style="position:absolute; top:3px; left:30px">
                        <i id="iconDown_${i}" data-index='${i}' class="fa fa-arrow-down" aria-hidden="true"></i></button>
                     <input id="chkInclude_${i}" style="position:absolute; left:100px; top:5px" class="flowChkGrouping" type="checkbox">`);

        // Now draw the buttons that represent mappable target columnDefs
        fo1.each(r => {
            let cx: number = 10; // (incrShiftX += 10);
            let objId = r.id;
            this.svgContainer
                // for all the columns that are to be wired from other commands, lay them out as buttons
                .selectAll('.mappableTarget')
                .data(this.projectService.getMappableTargetColumns(r.id, r.instance))
                .enter().append("foreignObject")
                .attr('x', d => {
                    let x2 = sx + maxObjWidth + 10 + cx;
                    d.width = this.getTextWidth(d.name, 11, "arial");
                    d.x = x2 + d.width / 2 + 3;
                    cx += (30 + d.width);
                    rightPos[objId] = cx; // remember the rightmost position
                    return x2;
                })
                .attr('y', d => { let y = yband(objId) + 3; d.y = y; return y; })
                .attr('width', d => d.width)
                .attr('height', colBtnHeight)
                .html(d => `<button id="btnMap_${fnGetCleanName(d.name)}_${r.objType}" data-obj-id="${objId}" data-obj-inst="${r.instance}" data-col-type="${d.dirType}" class="btn btn-xs flowBtnColumn ${this.getColumnDirClass(d.dirType)}" >${d.name}</button>`);
        });
        // Draw the shapes that represent mapped output column (source)
        selection.each(r => {
            let objId = r.id;
            let cx: number = rightPos[objId] || 10;
            this.svgContainer
                .selectAll('.mappedOutput')
                .data(this.projectService.getMappedSourceColumns(r.id, r.instance))
                .enter().append("rect")
                .attr('x', d => {
                    let x2 = sx + maxObjWidth + 10 + cx;
                    d.width = this.getTextWidth(d.name, 12, "arial") + 3;
                    d.x = x2 + d.width / 2;
                    cx += (30 + d.width);
                    return x2;
                })
                .attr('rx', 2)
                .attr('ry', 2)
                .attr('y', d => d.y = yband(objId) + 4)
                .attr('width', d => this.getTextWidth(d.name, 12, "arial") + 3)
                .attr('height', d => d.height = 20)
                .style("fill", 'coral')
                .style("stroke", 'brown');
            cx = 10;
            this.svgContainer
                .selectAll('.mappedOutputText')
                .data(this.projectService.getMappedSourceColumns(r.id, r.instance))
                .enter().append("text")
                .attr('x', d => {
                    return d.x - d.width / 2 + 3;
                })
                .attr('y', d => { let y = yband(objId) + 18; d.y = y; return y; })
                .style("fill", "#FFF")
                .style("stroke-width", 1)
                .style("font-size", "11px") // I use 12px to calculate the width, just so that it has some margin
                .style("font-family", "arial")
                .style("text-anchor", "start")
                .text(d => d.name);
        });

        // draw connection lines
        let lineFactory = d3.line().curve(d3.curveBasis);
        for (let dbObj of this.merged) {
            let cols: ColumnDef[] = this.projectService.getAllColumnsByObj(dbObj.id, dbObj.instance)

            for (let col of cols.filter(c => { return (c.plugIn.length > 0 && c.plugIn[0].constructor.name == "CommandOutputGenerator") })) {
                let mapId: number = (col.plugIn[0] as CommandOutputGenerator).outputMappingId;
                if (mapId) {
                    // find the outputMap object to reconnect src and col
                    let outMap: OutputMap = this.projectService.outputMaps.find(o => o.id == mapId);
                    let srcCol = this.projectService.getColumnFromDBObj(outMap.dbObjectId, outMap.instance, outMap.dirType, outMap.outputName);
                    if (srcCol) {
                        // don't understand why srcCol.y + height is too much
                        let points_a = [[srcCol.x, srcCol.y + 8], [srcCol.x, (srcCol.y + col.y) / 2], [col.x, (srcCol.y + col.y) / 2],
                        // srcCol must be above target col
                        [col.x, col.y - 4]];
                        this.svgContainer.append('path')
                            .datum(points_a)
                            .attr('d', lineFactory)
                            .attr('z', '0')
                            .attr('fill', 'none')
                            .attr('stroke', 'orange')
                            .attr('marker-end', 'url(#triangle)');
                    }
                }
                let cmdGen: CommandOutputGenerator = col.plugIn[0] as CommandOutputGenerator;
            }
        }
    }
    private redrawObjects() {
        d3.select("svg").remove();
        this.drawHeader();
        this.drawFlow();
    }
    private clearOutputMapping() {
        this.outputMapping.dbObjInstance = undefined;
        this.outputMapping.outputName = undefined;
    }

    ngOnInit() {
        this.globalListenFunc = this.renderer.listenGlobal("body", "click", (e) => {
            //console.log('event hit');
            //console.log(e.target.id);
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
            if (e.target.id.startsWith("btnMap_")) {
                let objId = $(e.target).data("obj-id");
                let inst = $(e.target).data("obj-inst");
                let dirType = $(e.target).data("col-type");
                let colName = $(e.target).html();
                this.clearOutputMapping();
                this.currColDef = this.projectService.getDBObjInstance(objId, inst).columns[dirType].find(c => c.name == colName);
                let mapId: number = (this.currColDef.plugIn[0] as CommandOutputGenerator).outputMappingId;
                if (mapId) {
                    let outMap: OutputMap = this.projectService.outputMaps.find(o => o.id == mapId);
                    this.outputMapping.dbObjInstance = outMap.dbObjectId + ":" + outMap.instance;
                    this.outputMapping.outputName = outMap.dirType + ":" + outMap.outputName;
                }
                $("#modalOutputMapping").modal('show');
            }
        });

        this.objects = this.projectService.selectedObjs;
        this.merged = [];
        Object.keys(this.objects).forEach(objType => this.merged = this.merged.concat(this.objects[objType]));
        this.merged.sort((a, b) => a.sequence - b.sequence);

        this.drawHeader();
        this.drawFlow();
    }
    ngOnDestroy() {
        this.globalListenFunc();
    }
}