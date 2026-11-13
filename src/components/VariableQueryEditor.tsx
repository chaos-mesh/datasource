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
import {
  CustomVariableSupport,
  DataQueryRequest,
  DataQueryResponse,
  QueryEditorProps,
} from '@grafana/data'
import { Combobox, ComboboxOption, InlineField, Input } from '@grafana/ui'
import _ from 'lodash'
import React, { ChangeEvent, useEffect, useMemo, useState } from 'react'
import { Observable, from, map } from 'rxjs'

import type { DataSource } from '../datasource'
import { ChaosMeshOptions, ChaosMeshVariableQuery, EventQuery } from '../types'

type Metric = ChaosMeshVariableQuery['metric']

const metricOptions: Array<ComboboxOption<Metric>> = [
  {
    label: 'Namespace',
    value: 'namespace',
    description: 'Retrieve all namespaces',
  },
  { label: 'Kind', value: 'kind', description: 'Retrieve all chaos kinds' },
  {
    label: 'Experiment',
    value: 'experiment',
    description: 'Retrieve experiments',
  },
  {
    label: 'Schedule',
    value: 'schedule',
    description: 'Retrieve schedules',
  },
  {
    label: 'Workflow',
    value: 'workflow',
    description: 'Retrieve workflows',
  },
]

type VariableQueryProps = QueryEditorProps<
  DataSource,
  EventQuery,
  ChaosMeshOptions,
  ChaosMeshVariableQuery
>

export const VariableQueryEditor = ({
  onChange,
  query,
}: VariableQueryProps) => {
  const debouncedOnChange = useMemo(() => _.debounce(onChange, 300), [onChange])
  const [state, setState] = useState(query)

  useEffect(() => {
    debouncedOnChange(state)
  }, [debouncedOnChange, state])

  const onMetricChange = (option: ComboboxOption<Metric>) => {
    setState({ ...state, metric: option.value })
  }

  const onQueryChange = (e: ChangeEvent<HTMLInputElement>) => {
    setState({ ...state, queryString: e.target.value })
  }

  return (
    <div className="gf-form">
      <InlineField
        label="Metric"
        tooltip="Select a metric to generate different sets of variable"
      >
        <Combobox
          width={30}
          options={metricOptions}
          value={state.metric}
          onChange={onMetricChange}
        />
      </InlineField>

      {['experiment', 'schedule', 'workflow'].includes(state.metric) && (
        <InlineField
          label="Queries"
          tooltip="Add a query string to the metric API"
        >
          <Input
            width={30}
            value={state.queryString}
            placeholder="?namespace=default"
            onChange={onQueryChange}
          />
        </InlineField>
      )}
    </div>
  )
}

export class ChaosMeshVariableSupport extends CustomVariableSupport<
  DataSource,
  ChaosMeshVariableQuery,
  EventQuery,
  ChaosMeshOptions
> {
  editor = VariableQueryEditor

  constructor(private datasource: DataSource) {
    super()
  }

  query(
    request: DataQueryRequest<ChaosMeshVariableQuery>
  ): Observable<DataQueryResponse> {
    return from(this.datasource.metricFindQuery(request.targets[0])).pipe(
      map((data) => ({ data }))
    )
  }
}
