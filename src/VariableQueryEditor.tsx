import { InlineLabel, Select } from '@grafana/ui';
import React, { useEffect, useState } from 'react';

import { SelectableValue } from '@grafana/data';
import { VariableQuery } from './types';

type Option = SelectableValue<VariableQuery['metric']>;

const metricOptions: Option[] = [
  { label: 'Namespace', value: 'namespace', description: 'Retrieve all namespaces' },
  { label: 'Kind', value: 'kind', description: 'Retrieve all chaos kinds' },
  { label: 'Experiment', value: 'experiment', description: 'Retrieve current all experiments' },
  { label: 'Schedule', value: 'schedule', description: 'Retrieve current all schedules' },
];

interface VariableQueryProps {
  query: VariableQuery;
  onChange: (query: VariableQuery, definition: string) => void;
}

export const VariableQueryEditor: React.FC<VariableQueryProps> = ({ query, onChange }) => {
  const [state, setState] = useState(query);

  const onMetricChange = (option: Option) => {
    setState({ ...state, metric: option.value! });
  };

  useEffect(() => {
    onChange(state, `metric: ${state.metric}`);
  }, [onChange, state]);

  return (
    <>
      <div className="gf-form">
        <InlineLabel
          width={20}
          tooltip="Select different metric to generate different sets of variables. Each of these metrics is exactly what its name says"
        >
          Metric
        </InlineLabel>
        <Select width={25} options={metricOptions} value={state.metric} onChange={onMetricChange} />
      </div>
    </>
  );
};
