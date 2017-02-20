import * as d3 from 'd3';
import { Component, NgZone, ElementRef, Renderer, OnDestroy } from "@angular/core";
import { Router } from '@angular/router';
import { BaseComponent } from "./base.component";
import { TRON_GLOBAL, TRON_EVENT, OBJ_TYPE, COL_DIR_TYPE } from './constants';
import { DataGenerator, fnGetDataTypeDesc, fnGetCleanName, fnGetLargeRandomNumber, fnIsGroup } from './include';
import * as gen from './generator/generators.component';
import { WizardStateService } from "./service/wizard-state";
import { SampleDataService } from "./service/sample-data";
import { ColumnDef, DBObjDef, ProjectService, OutputMap, GroupDef, DbObjIdentifier } from "./service/project";
import { CommandOutputGenerator } from "./generator/generators.component";
declare var require: (moduleId: string) => any;
var appConf = require('../app.conf');

class OutputMapAttribute {
    id: number;
    dbObjInstance: string;  // this combined objId : instance
    outputName: string;     // this combined dirType : column name
    clear() {
        this.id = null;
        this.dbObjInstance = null;
        this.outputName = null;
    }
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
        <button type="button" class="btn btn-danger" [hidden]="hideDeleteOutputMapping()" data-dismiss="modal" (click)="deleteOutputMapping()">Delete mapping</button>
        <button type="button" class="btn btn-primary" [disabled]="checkMappingDisabled()" data-dismiss="modal" (click)="saveOutputMappingChanges()">Save mapping</button>
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
    globalListenFunc1: Function; // storing the func pointer for calling to destroy it
    globalListenFunc2: Function;
    objects: { [objType: string]: DBObjDef[] };
    mergedDbObjs: DBObjDef[];
    outputMapping: OutputMapAttribute = new OutputMapAttribute();
    mappableOutputColumns: ColumnDef[] = [];
    currColDef: ColumnDef;
    dragDbObj: DBObjDef;
    dragGrp: GroupDef;
    dragdx: number; dragdy: number; // offset to the dragged object when first dragged
    maxObjWidth: number;
    gfx: any;
    //breakpt: boolean = false;

    //D3 related
    svgContainer: any;
    tran1: any;

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
    private hideDeleteOutputMapping() {
        if (this.outputMapping && this.outputMapping.id)
            return false;
        return true;
    }
    private deleteOutputMapping() {
        let outputMap = this.projectService.outputMaps.find(m => m.id == this.outputMapping.id);
        if (outputMap) {
            (this.currColDef.plugIn[0] as CommandOutputGenerator).outputMappingId = null;
            outputMap.refCount--;
            if (outputMap.refCount <= 0) { // if refCount drops to 0, GC it
                this.projectService.removeOutputMapping(outputMap.id);
            }
            this.drawFlow();
        }
        this.outputMapping.clear();
        // the data-dismiss doesn't always work
        $("#modalOutputMapping").modal('hide');
    }
    private boundOutputTargetIntoGroup() {
        let srcObjId: number, srcInst: number;
        [srcObjId, srcInst] = this.outputMapping.dbObjInstance.split(':').map(Number);
        let srcObj: DBObjDef = this.projectService.getDBObjInstance(srcObjId, srcInst);
        let targetObj: DBObjDef = this.projectService.getDBObjInstance(this.currColDef.dbObjId, this.currColDef.instance);

        try {
            if (srcObj.groupId && !targetObj.groupId) { // if the src obj is already in a group
                let grp: GroupDef = this.projectService.groups.find(g => g.id == srcObj.groupId);
                this.projectService.joinDbObjToGroup(targetObj, grp);
            }
            else if (!srcObj.groupId && !targetObj.groupId) { // neither object is in a group
                this.projectService.formGroup(targetObj, srcObj);
            }
            else {  // both objects are in groups (same or different groups?)
            }
        }
        catch (ex) {
            this.fnMsgBox("error", ex.toString());
        }
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
                this.projectService.removeOutputMapping(oldMap.id);
            }
        }
        this.boundOutputTargetIntoGroup();
        this.outputMapping.clear();

        this.drawFlow();
        $("#modalOutputMapping").modal('hide');
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
            .attr("height", 2000);

        this.gfx = this.svgContainer.append("g")
            .attr("x", 10)
            .attr("y", 10)
            .call(d3.drag()
                .on("start", () => {
                    //console.log('drag started!!!');
                    //console.log(d3.event);
                    let dx = d3.event.sourceEvent.offsetX, dy = d3.event.sourceEvent.offsetY;
                    this.mergedDbObjs.forEach(o => {
                        if (dx >= o.x && dx <= (o.x + this.maxObjWidth) && dy >= o.y && dy <= (o.y + 30)) {
                            this.dragdx = dx - o.x; this.dragdy = dy - o.y;
                            //console.log("drag subject found:");
                            //console.log(o);
                            this.dragDbObj = o;
                            o.isDrag = true;
                        }
                    });
                    if (!this.dragDbObj) {
                        this.projectService.groups.forEach(g => {
                            if (dx >= g.x && dx <= (g.x + g.width) && dy >= g.y && dy <= (g.y + g.height)) {
                                this.dragdx = dx - g.x; this.dragdy = dy - g.y;
                                //console.log("drag group found:");
                                //console.log(g);
                                this.dragGrp = g;
                                g.isDrag = true;
                            }
                        })
                    }
                })
                .on("drag", () => {
                    if (this.dragDbObj) {
                        //this.dragDbObj.x = d3.event.sourceEvent.offsetX - this.dragdx;
                        this.dragDbObj.y = d3.event.sourceEvent.offsetY - this.dragdy;
                        //console.log("dx dy:" + this.dragDbObj.x + " " + this.dragDbObj.y);
                        for (let o of this.mergedDbObjs.filter(d => d.id != this.dragDbObj.id)) {
                            if (Math.abs(o.y - this.dragDbObj.y) < 10) {
                                // Complex maneuver between db objs and db objs, db objs and groups, groups and groups
                                // I'm not merging db obj into a group ... yet
                                // Object to Object (no group) or within the same group
                                if ((!this.dragDbObj.groupId && !o.groupId) || (this.dragDbObj.groupId && o.groupId && this.dragDbObj.groupId == o.groupId)) {
                                    [o.sequence, this.dragDbObj.sequence] = [this.dragDbObj.sequence, o.sequence];
                                    if (this.dragDbObj.groupId)
                                        this.projectService.sortGroupMember(this.dragDbObj.groupId);
                                }
                                else if (!this.dragDbObj.groupId && o.groupId) { // swapping the position of one object with a group
                                    let minmax: string = (this.dragDbObj.sequence > o.sequence ? "min" : "max"); // dragging from below "min" or dragging from above "max"; counterintuitive ...
                                    let edgeObj: DBObjDef = this.projectService.findEdgeObjInGroup(o.groupId, minmax);
                                    if (edgeObj === o) { // same obj
                                        this.dragDbObj.sequence = o.sequence + (minmax == "min" ? -1 : 1);
                                        this.projectService.resequenceDbObjs();
                                    }
                                }
                                break;
                            }
                        };
                        this.drawFlow();
                    }
                    if (this.dragGrp) {
                        let oldy: number = this.dragGrp.y;
                        this.dragGrp.y = d3.event.sourceEvent.offsetY - this.dragdy;
                        let deltaY = this.dragGrp.y - oldy;
                        // for all its group members, it should move too
                        this.projectService.forEachGroupMember(this.dragGrp, a => {
                            a.y += deltaY
                            a.isDrag = true;
                        });
                        // switching position with objects that are not in group
                        for (let o of this.mergedDbObjs) {
                            // assuming the group is dragging downward
                            let cnt = this.dragGrp.members.length;
                            if (Math.abs(o.y - this.dragGrp.y) < 10) {
                                if (o.groupId) { // if o doesn't belong in a group, just switch position
                                    let edgeObj: DBObjDef = this.projectService.findEdgeObjInGroup(o.groupId, "min");
                                    if (edgeObj != o) { // same obj; we're hitting the top object of another group
                                        continue;
                                    }
                                }
                                let seq = o.sequence - cnt - 1; // should be enough?
                                this.projectService.forEachGroupMember(this.dragGrp, a => {
                                    a.sequence = ++seq;
                                });
                            }
                            else if (Math.abs(o.y - (this.dragGrp.y + this.dragGrp.height)) < 10) {
                                if (o.groupId) {
                                    let edgeObj: DBObjDef = this.projectService.findEdgeObjInGroup(o.groupId, "max");
                                    if (edgeObj != o) { // same obj; we're hitting the bottom  object of another group
                                        continue;
                                    }
                                }
                                let seq = o.sequence;
                                this.projectService.forEachGroupMember(this.dragGrp, a => {
                                    a.sequence = ++seq;
                                });
                            }
                        }
                        this.projectService.resequenceDbObjs();
                        this.drawFlow();
                    }
                })
                .on("end", () => {
                    if (this.dragDbObj) {
                        this.dragDbObj.isDrag = false;
                        this.dragDbObj = null;
                    }
                    if (this.dragGrp) {
                        this.projectService.forEachGroupMember(this.dragGrp, o => o.isDrag = false);
                        this.dragGrp.isDrag = false;
                        this.dragGrp = null;
                    }
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
        this.svgContainer.append("svg:defs").append("svg:marker")
            .attr("id", "disabled_triangle")
            .attr("refX", 6)
            .attr("refY", 6)
            .attr("markerWidth", 30)
            .attr("markerHeight", 30)
            .attr("orient", "auto")
            .append("path")
            .attr("d", "M 0 0 12 6 0 12 3 6")
            .style("fill", "#ccc");

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
            .attr("x1", 0)
            .attr("y1", 15)
            .attr("x2", 1600)
            .attr("y2", 15)
            .attr("stroke", "#DDD")
            .attr("strok-width", 1);

        this.svgContainer.append("foreignObject")
            .html(`<button title="Group" class="btn btn-xs btn-blue-gray" id="btnGroup"><i id="icoGroup" class="fa fa-object-group" aria-hidden="true"></i></button>`)
            .attr("x", 30)
            .attr("y", 20);
        this.svgContainer.append("foreignObject")
            .html(`<button title="Ungroup" class="btn btn-xs btn-blue-gray" id="btnUngroup"><i id="icoUngroup"  class="fa fa-object-ungroup" aria-hidden="true"></i></button>`)
            .attr("x", 60)
            .attr("y", 20);
            
    }
    private drawFlow() {
        let shiftRight: number = 0;
        let rightPos: { [objId: number]: number } = {};
        this.mergedDbObjs.sort((a, b) => a.sequence - b.sequence);
        // SX is the x of the db object rect; 
        let sx: number = 120;
        let szTxtRows = 80;
        let colBtnHeight: number = 25;
        // find width of the object with the longest name
        this.maxObjWidth = Math.max.apply(Math, this.mergedDbObjs.map(m => this.getTextWidth(m.name, 12, "arial"))) + 20;
        this.maxObjWidth = Math.max(this.maxObjWidth, 300);
        let maxY = this.mergedDbObjs.length * 100; // calculate the upperbound of rangeRound.
        // yband to calculate the y position for each dbobject, using id:instance as a marker
        let yband = d3.scaleBand().rangeRound([50, maxY]).domain(this.mergedDbObjs.map(o => o.id + ":" + o.instance));
        this.mergedDbObjs.forEach(o => {
            // preset the y
            if (!o.isDrag) {
                o.y = yband(o.id + ":" + o.instance);
                //console.log(o.name + ":" + o.y);
            }
        });

        // Draw group boundaries
        for (let grp of this.projectService.groups) {
            if (!grp.isDrag) {
                let minY = Number.MAX_VALUE; let maxY = Number.MIN_VALUE;
                for (let objId of grp.members) {
                    minY = Math.min(minY, yband(objId.dbObjectId + ":" + objId.instance));
                    maxY = Math.max(maxY, yband(objId.dbObjectId + ":" + objId.instance));
                }
                grp.x = sx - 10; grp.y = minY;
                grp.y = minY - 20;
                grp.width = this.maxObjWidth + 20;
                grp.height = maxY - minY + 60;
            }
        }
        let selectGroupBoundary = this.gfx.selectAll(".groupBoundary");
        let updateSel = selectGroupBoundary.data(this.projectService.groups, d => d.id);   // UPDATE selection
        updateSel.exit().remove();
        updateSel.enter().insert('rect',":first-child")
            .attr("class", "groupBoundary")
            .attr('rx', 5)
            .attr('ry', 5)
            .attr("width", d => d.width)
            .style("fill", '#FFF')
            .style("stroke", '#339966')
            .style('stroke-dasharray', [3, 3])
            .style('cursor', 'pointer')
            .merge(updateSel)
            //.transition(this.tran1)
            .attr("x", d => d.x) // set up the connection point origin
            .attr("y", d => {
                //console.log("group y: " + d.y);
                return d.y;
            })
            .attr("height", d => d.height);

        this.svgContainer.selectAll(".rowsHeaderText")
            .data([1])  // fake it so only draw once
            .enter().append("text")
            .attr("class", "rowsHeaderText")
            .attr("x", sx + 20 + this.maxObjWidth)
            .attr("y", 10)
            .attr("color", "#888")
            .text("# Rows");

        // Following typical D3 enter, exit, update patterns
        let selectObjTypeTitleRect = this.gfx.selectAll(".selectObjTypeTitleRect");            // initially empty; but during redraw, it won't be
        updateSel = selectObjTypeTitleRect.data(this.mergedDbObjs, d => d.id + ':' + d.instance);   // UPDATE selection
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

        let selectObjTypeTitleText = this.gfx.selectAll(".selectObjTypeTitleText");
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

        let selectDbObjRect = this.gfx.selectAll(".selectDbObjRect");
        updateSel = selectDbObjRect.data(this.mergedDbObjs, d => d.id + ':' + d.instance);   // UPDATE selection
        updateSel.exit().remove();
        let enterSelection = updateSel.enter();  // need a UPDATE + ENTER selection for later combining with columndef children
        let selMergedObjs = enterSelection.merge(updateSel);
        // ************** this is the main shape of the DB object
        updateSel.enter().append('rect')
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

        let selectDbObjText = this.gfx.selectAll(".selectDbObjText");
        updateSel = selectDbObjText.data(this.mergedDbObjs, d => d.id + ':' + d.instance);   // UPDATE selection
        updateSel.exit().remove();
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
        updateSel.exit().remove();
        updateSel.enter().append("foreignObject")
            .attr("class", "selectGroupCheckbox")
            .attr("width", 120)
            .attr("height", d => d.height = 20)
            .html((d, i) =>
                `<input id="chkInclude_${i}" data-obj-id="${d.id}" data-obj-inst="${d.instance}" class="flowChkGrouping" type="checkbox">`)
            .merge(updateSel)
            .style("display", d => this.projectService.isFirstObjInGroup(d) || !d.groupId ? "" : "none" )
            .attr("x", sx - 70)
            .attr("y", d => yband(d.id + ":" + d.instance));

        // the "# rows" textbox
        let selectRowsTextbox = this.svgContainer.selectAll(".selectRowsTextbox");
        updateSel = selectRowsTextbox.data(this.mergedDbObjs, d => d.id + ':' + d.instance);   // UPDATE selection
        updateSel.exit().remove();
        updateSel.enter().append("foreignObject")
            .attr("class", "selectRowsTextbox")
            .attr("width", szTxtRows)
            .attr("height", d => d.height = 20)
            .html((d, i) =>
                `<input class="form-control input-sm" id="txtRows_${i}" data-obj-id="${d.id}" data-obj-inst="${d.instance}"  type="text" style="width:${szTxtRows}px">`)
            .merge(updateSel)
            .style("display", d => this.projectService.isFirstObjInGroup(d) || !d.groupId ? "" : "none" )
            .attr("x", sx + this.maxObjWidth + 20)
            .attr("y", d => yband(d.id + ":" + d.instance));

        // instead of using nested data, it's simpler to flatten the mappable target as one collection
        let allMappableTarget: ColumnDef[] = []
        this.mergedDbObjs.forEach(o => {
            rightPos[o.id] = sx + this.maxObjWidth + szTxtRows + 30 + shiftRight;
            shiftRight = (shiftRight == 30) ? 0 : 30;
            allMappableTarget = allMappableTarget.concat(this.projectService.getMappableTargetColumns(o.id, o.instance));
        });
        // Using nested selection (columndef objects), draw the buttons that represent mappable target columnDefs
        let targetColSelection = this.svgContainer.selectAll('.mappableTarget')
            .data(allMappableTarget, (c: ColumnDef) => c.dbObjId + ':' + c.instance + ':' + c.dirType + ':' + c.name);
        targetColSelection.exit().remove();
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
            //.transition(this.tran1)
            .attr('x', (c: ColumnDef) => {
                let tmpX = rightPos[c.dbObjId];
                c.width = this.getTextWidth(c.name, 11, "arial") + 6;
                c.x = tmpX + c.width / 2 + 3;
                rightPos[c.dbObjId] += (30 + c.width);
                return tmpX;
            })
            .attr('y', (c: ColumnDef) => {
                return c.y = yband(String(c.dbObjId + ":" + c.instance)) + 3;
            });

        // Preparing to draw the mapped output colums (source)
        let allMappedOutput: ColumnDef[] = []
        this.mergedDbObjs.forEach(o => {
            allMappedOutput = allMappedOutput.concat(this.projectService.getMappedOutputColumns(o.id, o.instance));
        });
        // This should also be resulting in an UPDATE selection
        let mappedColSelection = this.svgContainer.selectAll('.mappedOutput')
            .data(allMappedOutput, (c: ColumnDef) => c.dbObjId + ':' + c.instance + ':' + c.dirType + ':' + c.name);
        mappedColSelection.exit().remove();
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
            //.transition(this.tran1)
            .attr('x', (c: ColumnDef) => {
                let tmpX = rightPos[c.dbObjId];
                c.x = tmpX + c.width / 2;   // cx is the center of the rect!!
                //console.log(c.name + ' cx: ' + c.x);
                //console.log(c.name + ' width: ' + c.width);
                rightPos[c.dbObjId] += (30 + c.width);
                return tmpX;
            })
            .attr('y', (c: ColumnDef) => {
                return c.y = yband(String(c.dbObjId + ":" + c.instance)) + 4;
            });

        let mappedColTextSelection = this.svgContainer.selectAll('.mappedOutputText')
            .data(allMappedOutput, (c: ColumnDef) => c.dbObjId + ':' + c.instance + ':' + c.dirType + ':' + c.name); selMergedObjs
        mappedColTextSelection.exit().remove();
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
            //.transition(this.tran1)
            .attr('x', (c: ColumnDef) => c.x)
            .attr('y', (c: ColumnDef) => c.y + 14);

        // draw connection lines
        let series: any[] = []; // series represent the group of connector lines
        let lineIds: string[] = []; // don't know how to embedded a unique id in the series
        let lineAttr: any[] = [];
        this.projectService.getAllObjects().forEach(o => {
            this.projectService.getMappableTargetColumns(o.id, o.instance).forEach(target => {
                let cmdGen: CommandOutputGenerator = target.plugIn[0] as CommandOutputGenerator;
                if (cmdGen.outputMappingId) {
                    let outMap: OutputMap = this.projectService.outputMaps.find(p => p.id == cmdGen.outputMappingId);
                    let src: ColumnDef = this.projectService.getColumnFromDBObj(outMap.dbObjectId, outMap.instance, outMap.dirType, outMap.outputName);
                    series.push([{ x: src.x, y: src.y + (target.y > src.y ? 22 : 0) },
                    { x: src.x, y: (src.y + target.y) / 2 }, { x: target.x, y: (src.y + target.y) / 2 },
                    { x: target.x, y: target.y + (target.y > src.y ? -8 : 30) }]);
                    // this is to uniquely identify each line, using src and target attributes
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
                    if (target.y > src.y)
                        lineAttr.push({ 'stroke': 'orange', 'stroke-dasharray': 'none', 'marker-end': 'url(#triangle)' });
                    else // these lines should be removed because they are upside down
                        lineAttr.push({ 'stroke': '#ccc', 'stroke-dasharray': [3, 3], 'marker-end': 'url(#disabled_triangle)' });
                }
            });
        });

        var lineFunction = d3.line()
            .x(function (d: any) { return d.x })
            .y(function (d: any) { return d.y })
            .curve(d3.curveBasis);
        let selPath = this.svgContainer.selectAll(".connectorLine")
            .data(series, (d, i) => lineIds[i]);
        selPath.exit().remove();
        selPath
            .enter().append("path")
            .attr("class", "connectorLine")
            .attr('z', '0')
            .attr('fill', 'none')
            .merge(selPath)
            //.transition(this.tran1)
            .attr('marker-end', (d, i) => lineAttr[i]['marker-end'])
            .attr("d", lineFunction)
            .attr('stroke', (d, i) => lineAttr[i]['stroke'])
            .attr('stroke-dasharray', (d, i) => lineAttr[i]['stroke-dasharray']);
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

    private groupObjs() {
        let chkObjs: (DBObjDef | GroupDef)[] = [];  
        $(".flowChkGrouping").each((i, e) => {
            if ($(e).prop("checked") && $(e).css('display') != 'none') {
                let objId = $(e).data("obj-id");
                let inst = $(e).data("obj-inst");
                let dbObj = this.projectService.getDBObjInstance(objId, inst);
                if (!dbObj.groupId)
                    chkObjs.push(dbObj);
                else {
                    let grp:GroupDef = this.projectService.groups.find(g => g.id == dbObj.groupId);
                    chkObjs.push(grp);
                }
            }
        });
        let newGrp:GroupDef;
        if (chkObjs.length <= 1) {
            this.fnMsgBox("You need to select more than one object to group");
            return;
        }
        let obj = chkObjs[0];
        if (fnIsGroup(obj)) {
            if (!newGrp)
                newGrp = obj as GroupDef;
        }
        else {
            newGrp = new GroupDef();
            newGrp.id = fnGetLargeRandomNumber();
            newGrp.members.push(new DbObjIdentifier({ dbObjectId: obj.id, instance: obj.instance }));
            obj.groupId = newGrp.id;
            this.projectService.groups.push(newGrp);
            this.projectService.resequenceDbObjs();
        }
        for (let i = 1; i < chkObjs.length; i++) {
            let obj = chkObjs[i];
            if (fnIsGroup(obj)) {
                this.projectService.joinGroups(newGrp, obj);
            }
            else {
                this.projectService.joinDbObjToGroup(obj, newGrp);
            }
            this.projectService.resequenceDbObjs();
        }
        this.drawFlow();
    }
    ngOnInit() {
        this.tran1 = d3.transition("tran1")
            .duration(400)
            .ease(d3.easeLinear);

        this.globalListenFunc2 = this.renderer.listenGlobal("body", "change", (e) => {
            //this.ngZone.run(() => {
            if (!e.target.id)
                return;
            console.log('change hit');
            console.log(e.target);
            if (e.target.id.startsWith("txtRows_")) {
                let objId = $(e.target).data("obj-id");
                let inst = $(e.target).data("obj-inst");
                let dbObj: DBObjDef = this.projectService.getDBObjInstance(objId, inst);
                dbObj.rowcount = e.target.value;
            }
            //});
        });
        this.globalListenFunc1 = this.renderer.listenGlobal("body", "click", (e) => {
            //this.ngZone.run(() => {
            if (!e.target.id)
                return;

            console.log('event hit');
            console.log(e.target);
            if (e.target.id == "btnGroup" || e.target.id == "icoGroup") {
                this.groupObjs();
            }
            if (e.target.id == "btnUngroup" || e.target.id == "icoUngroup") {
                console.log("unggrouping button")
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
                    this.outputMapping.id = outMap.id;
                }
                $("#modalOutputMapping").modal('show');
            }
            // });
        });

        this.objects = this.projectService.selectedObjs;
        this.mergedDbObjs = [];
        Object.keys(this.objects).forEach(objType => this.mergedDbObjs = this.mergedDbObjs.concat(this.objects[objType]));
        this.mergedDbObjs.sort((a, b) => a.sequence - b.sequence);

        this.drawHeader();
        this.drawFlow();
    }
    ngOnDestroy() {
        this.globalListenFunc1();
        this.globalListenFunc2();
    }
}