import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { InlineFormLabel, LegacyForms } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, EventsQuery } from './types';

const { FormField, Select } = LegacyForms;

type Props = QueryEditorProps<DataSource, EventsQuery, MyDataSourceOptions>;

const kindOptions: Array<SelectableValue<string>> = [
  { value: 'PodChaos', label: 'pod chaos' },
  { value: 'NetworkChaos', label: 'network chaos' },
  { value: 'IOChaos', label: 'io chaos' },
  { value: 'TimeChaos', label: 'time chaos' },
  { value: 'KernelChaos', label: 'kernel chaos' },
  { value: 'StressChaos', label: 'stress chaos' },
];

export class QueryEditor extends PureComponent<Props> {
  onNamespaceChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, namespace: event.target.value });
    onRunQuery();
  };

  onKindChange = (item: SelectableValue<string>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, kind: item.value! });
    onRunQuery();
  };

  onExperimentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query, onRunQuery } = this.props;
    onChange({ ...query, experiment: event.target.value });
    onRunQuery();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { namespace, experiment } = query;
    const selectedKind = kindOptions.find(o => o.value === query.kind);

    return (
      <div>
        <div className="gf-form">
          <FormField width={4} value={namespace} onChange={this.onNamespaceChange} label="Namespace" />
          <FormField
            labelWidth={12}
            value={experiment || ''}
            onChange={this.onExperimentChange}
            label="Experiment Name"
          />
        </div>

        <div className="gf-form">
          <InlineFormLabel width={8}>Chaos Kind</InlineFormLabel>
          <Select width={8} value={selectedKind} onChange={this.onKindChange} options={kindOptions} />
        </div>
      </div>
    );
  }
}
