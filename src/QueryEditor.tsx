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
import { QueryEditorProps } from '@grafana/data';
import { LegacyForms } from '@grafana/ui';
import { DebouncedFunc } from 'lodash';
import _ from 'lodash';
import React, { ChangeEvent, PureComponent } from 'react';

import { DataSource } from './datasource';
import { ChaosMeshOptions, EventsQuery, defaultQuery } from './types';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, EventsQuery, ChaosMeshOptions>;

export class QueryEditor extends PureComponent<Props> {
  onRunQueryDebounced: DebouncedFunc<any>;

  constructor(props: Props) {
    super(props);

    this.onRunQueryDebounced = _.debounce(this.props.onRunQuery, 500);
  }

  onChange = (key: keyof EventsQuery) => (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;

    let value: string | number = event.target.value;
    if (key === 'limit') {
      value = parseInt(value, 10);
    }

    onChange({ ...query, [key]: value });
    // executes the query
    this.onRunQueryDebounced();
  };

  render() {
    const query = _.defaults(this.props.query, defaultQuery);
    const { object_id, namespace, name, kind, limit } = query;

    return (
      <div className="gf-form">
        <FormField
          value={object_id || ''}
          onChange={this.onChange('object_id')}
          label="Object ID"
          tooltip="Filter events by Object ID."
        />
        <FormField
          value={namespace || ''}
          onChange={this.onChange('namespace')}
          label="Namespace"
          tooltip="Filter events by Namespace."
        />
        <FormField value={name || ''} onChange={this.onChange('name')} label="Name" tooltip="Filter events by Name." />
        <FormField value={kind || ''} onChange={this.onChange('kind')} label="Kind" tooltip="Filter events by Kind." />
        <FormField
          type="number"
          value={limit}
          onChange={this.onChange('limit')}
          label="Limit"
          tooltip="Limit the number of events to be fetched from the Chaos Mesh server."
        />
      </div>
    );
  }
}
