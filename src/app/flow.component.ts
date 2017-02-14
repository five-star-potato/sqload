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

interface SrcTargetLine {
    srcObjId: number;
    srcInstance: number;
    targetObjId: number;
    targetInstance: number;
    srcDirType: COL_DIR_TYPE;
    srcColName: string;
    targetDirType: COL_DIR_TYPE;
    targetColName: string;
    x1: number;
    y1: number;
    x2: number;
    y2: number;
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
                <button style="margin-top:30px" class='btn btn-warning nav-btn' (click)="drawFlow()">Redraw</button>
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
                    <option *ngFor="let obj of mergedDbObjs" [value]="obj.id + ':' + obj.instance">{{obj.name + ':' + obj.instance}}</option>
                </select>
            </div>
            <div class="form-group">
                <select required [(ngModel)]="outputMapping.outputName" class="form-control"> 
                    <option *ngFor="let col of mappableOutputColumns" [value]="col.dirType + ':' +  col.name">{{ col.dirType + ' - ' + col.name}}</option>
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
    mergedDbObjs: DBObjDef[];
    outputMapping: OutputMapAttribute = new OutputMapAttribute();
    mappableOutputColumns: ColumnDef[] = [];
    currColDef: ColumnDef;
    dragDbObj: DBObjDef;
    maxObjWidth: number;

    constructor(router: Router, ngZone: NgZone, wizardStateService: WizardStateService, dataService: SampleDataService, projectService: ProjectService,
        public el: ElementRef, public renderer: Renderer) {
        super(router, ngZone, wizardStateService, dataService, projectService);
    }
    private mappingObjChanged(value) {
        this.outputMapping.dbObjInstance = value;
        let objId: number, instance: number;
        [objId, instance] = value.split(":").map(Number);
        this.mappableOutputColumns = this.projectService.getMappableOutputColumns(objId, instance);
    }
    private moveUp(index: number) {
        var b = this.mergedDbObjs[index].sequence;
        this.mergedDbObjs[index].sequence = this.mergedDbObjs[index - 1].sequence;
        this.mergedDbObjs[index - 1].sequence = b;
    }
    private moveDown(index: number) {
        var b = this.mergedDbObjs[index].sequence;
        this.mergedDbObjs[index].sequence = this.mergedDbObjs[index + 1].sequence;
        this.mergedDbObjs[index + 1].sequence = b;
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
            newMap = new OutputMap({
                id: fnGetLargeRandomNumber(),
                dbObjectId: objId,
                instance: instance,
                dirType: dirType,
                outputName: colName,
                refCount: 1
            });
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
    private getColumnDirClass(dirType: COL_DIR_TYPE): string {
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
            .attr("height", 2000)
            .call(d3.drag()
                .on("start", () => {
                    console.log('drag started!!!');
                    console.log(d3.event);
                    this.mergedDbObjs.forEach(o => {
                        let dx = d3.event.x, dy = d3.event.y;
                        if (dx >= o.x && dx <= (o.x + this.maxObjWidth) && dy >= o.y && dy <= (o.y + 30)) {
                            console.log("drag subject found:");
                            console.log(o);
                            this.dragDbObj = o;
                            o.isDrag = true;
                        }
                    })
                })
                .on("drag", () => {
                    if (this.dragDbObj) {
                        this.dragDbObj.x = d3.event.x;
                        this.dragDbObj.y = d3.event.y;
                        this.drawFlow();
                    }
                })
                .on("end", () => {
                    this.dragDbObj.isDrag = false;
                    this.dragDbObj = null;
                    this.drawFlow();
                })
            );

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
            .attr("x", 35)
            .attr("y", 10)
            .attr("color", "#888")
            .text("Group");
        this.svgContainer.append("text")
            .attr("x", 110)
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
        let rightPos: { [objId: number]: number } = {};
        this.mergedDbObjs.sort((a, b) => a.sequence - b.sequence);
        // SX is the x of the db object rect; 
        let sx: number = 100;
        let szTxtRows = 80;

        let colBtnHeight: number = 25;
        // find width of the object with the longest name
        this.maxObjWidth = Math.max.apply(Math, this.mergedDbObjs.map(m => this.getTextWidth(m.name, 12, "arial"))) + 20;
        this.maxObjWidth = Math.max(this.maxObjWidth, 300);
        let maxY = this.mergedDbObjs.length * 120; // calculate the upperbound of rangeRound.
        // yband to calculate the y position for each dbobject, using id as a marker
        let yband = d3.scaleBand().rangeRound([40, maxY]).domain(this.mergedDbObjs.map(m => String(m.id)));
        this.mergedDbObjs.forEach(o => {
            // preset the y
            if (!o.isDrag)
                o.y = yband(String(o.id));
        });

        this.svgContainer.selectAll(".rowsHeaderText")
            .data([1])  // fake it so only draw once
            .enter().append("text")
            .attr("class", "rowsHeaderText")
            .attr("x", sx + 10 + this.maxObjWidth)
            .attr("y", 10)
            .attr("color", "#888")
            .text("# Rows");

        // Following typical D3 enter, exit, update patterns
        let selectObjTypeTitleRect = this.svgContainer.selectAll(".selectObjTypeTitleRect");            // initially empty; but during redraw, it won't be
        let updateSel = selectObjTypeTitleRect.data(this.mergedDbObjs, d => d.id + ':' + d.instance);   // UPDATE selection
        updateSel.exit().remove();
        // the rectangle and text display for each selected object
        // This is the small label in the topleft
        updateSel.enter().append('rect')        // ENTER selection
            .attr('rx', 2)
            .attr('ry', 2)
            .attr("width", 94)
            .attr("height", 15)
            .attr("class", "selectObjTypeTitleRect")
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
            })
            .merge(updateSel) // this is merging the UPDATE + ENTER selection; remember that D3 selection is immutable
            .attr("x", sx + 5) // set up the connection point origin
            .attr("y", d => d.y - 13);

        let selectObjTypeTitleText = this.svgContainer.selectAll(".selectObjTypeTitleText");
        updateSel = selectObjTypeTitleText.data(this.mergedDbObjs, d => d.id + ':' + d.instance);   // UPDATE selection
        updateSel.exit().remove();
        // this is the word TABLE, VIEW, ...
        updateSel.enter().append('text')
            .attr("class", "selectObjTypeTitleText")
            .style("fill", "#fff")
            .style("stroke-width", 1)
            .style("font-size", "10px")
            .style("font-family", "arial")
            .style("text-anchor", "start")
            .text(d => this.getObjectTypeName(d.objType))
            .merge(updateSel)
            .attr("x", sx + 11)
            .attr("y", d => d.y - 3);

        let selectDbObjRect = this.svgContainer.selectAll(".selectDbObjRect");
        updateSel = selectDbObjRect.data(this.mergedDbObjs, d => d.id + ':' + d.instance);   // UPDATE selection
        let selMergedObj = updateSel.enter();  // need a UPDATE + ENTER selection for later combining with columndef children
        // this is the main shape of the DB object
        selMergedObj.append('rect')
            .attr("class", "selectDbObjRect")
            .attr('rx', 5)
            .attr('ry', 5)
            .attr("width", this.maxObjWidth)
            .attr("height", 30)
            .style("fill", '#FFF')
            .style("stroke", '#888')
            .style('cursor', 'pointer')
            .merge(updateSel)
            .attr("x", d => { return d.x = sx; }) // set up the connection point origin
            .attr("y", d => { return d.y; });

        let selectDbObjText = this.svgContainer.selectAll(".selectDbObjText");
        updateSel = selectDbObjText.data(this.mergedDbObjs, d => d.id + ':' + d.instance);   // UPDATE selection
        // DB Object label
        updateSel.enter().append('text')
            .attr("class", "selectDbObjText")
            .style("fill", "#888")
            .style("stroke-width", 1)
            .style("font-size", "12px")
            .style("font-family", "arial")
            .style("text-anchor", "start")
            .style('cursor', 'pointer')
            .text(d => d.name)
            .merge(updateSel)
            .attr("x", sx + 10)
            .attr("y", d => d.y + 20);

        // HTML elements are wrapped inside foreignObject
        // these are group checkboxes
        let selectGroupCheckbox = this.svgContainer.selectAll(".selectGroupCheckbox");
        updateSel = selectGroupCheckbox.data(this.mergedDbObjs, d => d.id + ':' + d.instance);   // UPDATE selection
        updateSel.enter().append("foreignObject")
            .attr("class", "selectGroupCheckbox")
            .attr("width", 120)
            .attr("height", d => d.height = 20)
            .html((d, i) =>
                `<input id="chkInclude_${i}" class="flowChkGrouping" type="checkbox">`)
            .merge(updateSel)
            .attr("x", sx - 50)
            .attr("y", d => yband(d.id));

        // the "# rows" textbox
        let selectRowsTextbox = this.svgContainer.selectAll(".selectRowsTextbox");
        updateSel = selectRowsTextbox.data(this.mergedDbObjs, d => d.id + ':' + d.instance);   // UPDATE selection
        updateSel.enter().append("foreignObject")
            .attr("class", "selectRowsTextbox")
            .attr("width", szTxtRows)
            .attr("height", d => d.height = 20)
            .html((d, i) =>
                `<input class="form-control input-sm" id="txtRows_${i}" type="text" style="width:${szTxtRows}px">`)
            .merge(updateSel)
            .attr("x", sx + this.maxObjWidth + 10)
            .attr("y", d => yband(d.id));

        // Using nested selection (columndef objects), draw the buttons that represent mappable target columnDefs
        let targetColSelection = selMergedObj
            .selectAll('.mappableTarget')
            .data((d, i) => {
                rightPos[d.id] = sx + this.maxObjWidth + szTxtRows + 20;
                return this.projectService.getMappableTargetColumns(d.id, d.instance);
            },
            (c: ColumnDef) => c.dbObjId + ':' + c.instance + ':' + c.dirType + ':' + c.name);
        targetColSelection.enter()
            // for all the columns that are to be wired from other commands, lay them out as buttons
            .append("foreignObject")
            .attr("class", "mappableTarget")
            .attr('height', colBtnHeight)
            .html((c: ColumnDef, i, j) => {
                let o: DBObjDef = this.projectService.getDBObjInstance(c.dbObjId, c.instance);
                let btn = `<button id="btnMap_${fnGetCleanName(c.name)}_${o.objType}" data-obj-id="${c.dbObjId}" data-obj-inst="${o.instance}" data-col-type="${c.dirType}" class="btn btn-xs flowBtnColumn ${this.getColumnDirClass(c.dirType)}" >${c.name}</button>`;
                return btn;
            })
            .merge(targetColSelection)
            .attr('x', (c: ColumnDef) => {
                let tmpX = rightPos[c.dbObjId];
                c.width = this.getTextWidth(c.name, 11, "arial") + 6;
                c.x = tmpX + c.width / 2 + 3;
                rightPos[c.dbObjId] += (30 + c.width);
                return tmpX;
            })
            .attr('y', (c: ColumnDef) => {
                return c.y = yband(String(c.dbObjId)) + 3;
            });

        // This should also be resulting in an UPDATE selection
        let mappedColSelection = selMergedObj
            .selectAll('.mappedOutput')
            .data((d, i) => {
                return this.projectService.getMappedOutputColumns(d.id, d.instance);
            });
        mappedColSelection.enter()
            .append("rect")
            .attr('rx', 2)
            .attr('ry', 2)
            .attr('width', d => { return d.width = this.getTextWidth(d.name, 11, "arial") + 10; })
            .attr('height', d => d.height = 20)
            .attr("class", "mappedOutput")
            .style("fill", 'coral')
            .style("stroke", 'brown')
            .merge(mappedColSelection)
            .attr('x', (c: ColumnDef) => {
                let tmpX = rightPos[c.dbObjId];
                c.x = tmpX + c.width / 2;   // cx is the center of the rect!!
                //console.log(c.name + ' cx: ' + c.x);
                //console.log(c.name + ' width: ' + c.width);
                rightPos[c.dbObjId] += (30 + c.width);
                return tmpX;
            })
            .attr('y', (c: ColumnDef) => {
                return c.y = yband(String(c.dbObjId)) + 4;
            });

        let mappedColTextSelection = selMergedObj
            .selectAll('.mappedOutputText')
            .data((d, i) => {
                return this.projectService.getMappedOutputColumns(d.id, d.instance);
            });

        mappedColTextSelection.enter()
            .append("text")
            .attr("class", "mappedOutputText")
            .style("fill", "#FFF")
            .style("stroke-width", 1)
            .style("font-size", "11px") // I use 12px to calculate the width, just so that it has some margin
            .style("font-family", "arial")
            .style("text-anchor", "middle")
            .text((c: ColumnDef) => c.name)
            .merge(mappedColTextSelection)
            .attr('x', (c: ColumnDef) => c.x)
            .attr('y', (c: ColumnDef) => c.y + 14);

        // draw connection lines
        let series: any[] = []; // series represent the group of connector lines
        let lineIds: string[] = []; // don't know how to embedded a unique id in the series
        this.projectService.getAllObjects().forEach(o => {
            this.projectService.getMappableTargetColumns(o.id, o.instance).forEach(target => {
                let cmdGen: CommandOutputGenerator = target.plugIn[0] as CommandOutputGenerator;
                if (cmdGen.outputMappingId) {
                    let outMap: OutputMap = this.projectService.outputMaps.find(p => p.id == cmdGen.outputMappingId);
                    let src: ColumnDef = this.projectService.getColumnFromDBObj(outMap.dbObjectId, outMap.instance, outMap.dirType, outMap.outputName);
                    series.push([{ x: src.x, y: src.y + 22 }, { x: src.x, y: (src.y + target.y) / 2 }, { x: target.x, y: (src.y + target.y) / 2 }, { x: target.x, y: target.y - 8 }]);
                    lineIds.push(
                        outMap.dbObjectId + ':' +
                        outMap.instance + ':' +
                        src.dirType + ':' +
                        src.name + ':' +
                        o.id + ':' +
                        o.instance + ':' +
                        target.dirType + ':' +
                        target.name
                    );
                }
            });
        });

        var lineFunction = d3.line()
            .x(function (d: any) { return d.x })
            .y(function (d: any) { return d.y })
            .curve(d3.curveBasis);
        let selPath = this.svgContainer.selectAll(".connectorLine")
            .data(series, (d, i) => lineIds[i]);
        selPath
            .enter().append("path")
            .attr("class", "connectorLine")
            .attr('z', '0')
            .attr('fill', 'none')
            .attr('stroke', 'orange')
            .attr('marker-end', 'url(#triangle)')
            .merge(selPath)
            .attr("d", lineFunction);
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
            this.ngZone.run(() => {
                //console.log('event hit');
                //console.log(e.target.id);
                if (e.target.id.startsWith("btnDown_") || e.target.id.startsWith("iconDown_")) {
                    let i: number = +$(e.target).data("index"); // force it number
                    if (i < this.mergedDbObjs.length - 1) {
                        let obj1: DBObjDef = this.mergedDbObjs[i];
                        let obj2: DBObjDef = this.mergedDbObjs[i + 1];
                        [obj1.sequence, obj2.sequence] = [obj2.sequence, obj1.sequence];
                    }
                    this.redrawObjects();
                }
                if (e.target.id.startsWith("btnUp_") || e.target.id.startsWith("iconUp_")) {
                    let i: number = +$(e.target).data("index"); // force it number
                    if (i > 0) {
                        let obj1: DBObjDef = this.mergedDbObjs[i];
                        let obj2: DBObjDef = this.mergedDbObjs[i - 1];
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
                    let cmdGen: CommandOutputGenerator = (this.currColDef.plugIn[0] as CommandOutputGenerator);
                    if (cmdGen && cmdGen.outputMappingId) {
                        let outMap: OutputMap = this.projectService.outputMaps.find(o => o.id == cmdGen.outputMappingId);
                        this.mappableOutputColumns = this.projectService.getMappableOutputColumns(outMap.dbObjectId, outMap.instance);
                        this.outputMapping.dbObjInstance = outMap.dbObjectId + ":" + outMap.instance;
                        this.outputMapping.outputName = outMap.dirType + ":" + outMap.outputName;
                    }
                    $("#modalOutputMapping").modal('show');
                }
            });
        });

        this.objects = this.projectService.selectedObjs;
        this.mergedDbObjs = [];
        Object.keys(this.objects).forEach(objType => this.mergedDbObjs = this.mergedDbObjs.concat(this.objects[objType]));
        this.mergedDbObjs.sort((a, b) => a.sequence - b.sequence);

        this.drawHeader();
        this.drawFlow();
    }
    ngOnDestroy() {
        this.globalListenFunc();
    }
}