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
import { QueryEditorProps } from '@grafana/data';
import { InlineField, Input } from '@grafana/ui';
import React, { ChangeEvent } from 'react';

import { DataSource } from '../datasource';
import { ChaosMeshOptions, EventsQuery } from '../types';

type Props = QueryEditorProps<DataSource, EventsQuery, ChaosMeshOptions>;

export function QueryEditor({ query, onChange, onRunQuery }: Props) {
  const _onChange =
    (key: keyof EventsQuery) => (event: ChangeEvent<HTMLInputElement>) => {
      let value = event.target.value;
      let usedValue;

      if (key === 'limit') {
        usedValue = parseInt(value, 10);
      }

      onChange({ ...query, [key]: usedValue });
      // executes the query
      onRunQuery();
    };

  const { object_id } = query;

  return (
    <div className="gf-form">
      <InlineField label="Object ID" tooltip="Filter events by Object ID">
        <Input onChange={_onChange('object_id')} value={object_id} />
      </InlineField>
    </div>
  );
}
