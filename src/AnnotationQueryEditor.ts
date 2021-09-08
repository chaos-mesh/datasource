import { kinds } from './types';

export class AnnotationQueryEditor {
  static templateUrl = 'partials/annotations.editor.html';
  kinds = kinds;

  annotation: any;

  constructor() {
    this.annotation.object_id = this.annotation.object_id || '';
    this.annotation.namespace = this.annotation.namespace || '';
    this.annotation.nname = this.annotation.nname || ''; // there is a conflict with annotation name, so rename it to nname
    this.annotation.kind = this.annotation.kind || '';
    this.annotation.limit = this.annotation.limit || 216;
  }
}
