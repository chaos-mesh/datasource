/*
 * Copyright 2022 Chaos Mesh Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
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
