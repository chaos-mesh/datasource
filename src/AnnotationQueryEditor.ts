import { kindOptions } from './types';

export class AnnotationQueryEditor {
  static templateUrl = 'partials/annotations.editor.html';

  annotation: any;

  kindOptions = kindOptions;

  constructor() {
    this.annotation.namespace = this.annotation.namespace || 'default';
    this.annotation.kind = this.annotation.kind || 'PodChaos';
  }
}
