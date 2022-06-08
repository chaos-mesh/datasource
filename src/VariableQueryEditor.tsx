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
import { SelectableValue } from '@grafana/data'
import { InlineFormLabel, Select } from '@grafana/ui'
import React, { useEffect, useState } from 'react'

import { VariableQuery } from './types'

type Option = SelectableValue<VariableQuery['metric']>

const metricOptions: Option[] = [
  { label: 'Namespace', value: 'namespace', description: 'Retrieve all namespaces' },
  { label: 'Kind', value: 'kind', description: 'Retrieve all chaos kinds' },
  { label: 'Experiment', value: 'experiment', description: 'Retrieve current all experiments' },
  { label: 'Schedule', value: 'schedule', description: 'Retrieve current all schedules' },
]

interface VariableQueryProps {
  query: VariableQuery
  onChange: (query: VariableQuery, definition: string) => void
}

export const VariableQueryEditor: React.FC<VariableQueryProps> = ({ query, onChange }) => {
  const [state, setState] = useState(query)

  const onMetricChange = (option: Option) => {
    setState({ ...state, metric: option.value! })
  }

  useEffect(() => {
    onChange(state, `metric: ${state.metric}`)
  }, [onChange, state])

  return (
    <>
      <div className="gf-form">
        <InlineFormLabel
          width={10}
          tooltip="Select different metric to generate different sets of variables. Each of these metrics is exactly what its name says"
        >
          Metric
        </InlineFormLabel>
        <Select width={25} options={metricOptions} value={state.metric} onChange={onMetricChange} />
      </div>
    </>
  )
}
