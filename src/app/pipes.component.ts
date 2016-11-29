import {  Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'selectedObjects', pure: false })
export class selectedObjectsPipe implements PipeTransform {
  transform(allTbls: any[], param: boolean) {
    return allTbls.filter(c => (c.selected == param));
  }
}
