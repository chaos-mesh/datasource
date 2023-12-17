/*
 * Copyright 2023 Chaos Mesh Authors.
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
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { InlineField, Input, Select } from '@grafana/ui';
import React, { ChangeEvent } from 'react';

import { DataSource } from '../datasource';
import { ChaosMeshOptions, EventsQuery, kindOptions } from '../types';

type Props = QueryEditorProps<DataSource, EventsQuery, ChaosMeshOptions>;

export function QueryEditor({ query, onChange, onRunQuery }: Props) {
  const onInputChange =
    (key: keyof EventsQuery) => (event: ChangeEvent<HTMLInputElement>) => {
      let value: any = event.target.value;

      if (key === 'limit') {
        value = parseInt(value, 10);
      }

      onChange({ ...query, [key]: value });
      // executes the query
      onRunQuery();
    };

  const onSelectChange =
    (key: keyof EventsQuery) => (val: SelectableValue<string> | null) => {
      onChange({ ...query, [key]: val ? val.value : undefined });
      // executes the query
      onRunQuery();
    };

  const { object_id, namespace, name, kind, limit } = query;

  return (
    <div className="gf-form">
      <InlineField label="Object ID" tooltip="Filter events by object ID">
        <Input value={object_id} onChange={onInputChange('object_id')} />
      </InlineField>
      <InlineField label="Namespace" tooltip="Filter events by namespace">
        <Input value={namespace} onChange={onInputChange('namespace')} />
      </InlineField>
      <InlineField label="Name" tooltip="Filter events by name">
        <Input value={name} onChange={onInputChange('name')} />
      </InlineField>
      <InlineField label="Kind" tooltip="Filter events by kind">
        <Select
          value={kind}
          options={kindOptions}
          onChange={onSelectChange('kind')}
          isClearable
          allowCustomValue
        />
      </InlineField>
      <InlineField
        label="Limit"
        tooltip="Limit the number of events to be fetched from the server"
      >
        <Input type="number" value={limit} onChange={onInputChange('limit')} />
      </InlineField>
    </div>
  );
}
