import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { InlineFormLabel, LegacyForms } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, MyDataSourceOptions, ChaosEventsQuery } from './types';

const { Input, Select } = LegacyForms;

type Props = QueryEditorProps<DataSource, ChaosEventsQuery, MyDataSourceOptions>;

const kindOptions: Array<SelectableValue<string>> = [
  { value: 'PodChaos', label: 'Pod Chaos' },
  { value: 'NetworkChaos', label: 'Network Chaos' },
  { value: 'IOChaos', label: 'IO Chaos' },
  { value: 'TimeChaos', label: 'Time Chaos' },
  { value: 'KernelChaos', label: 'Kernel Chaos' },
  { value: 'StressChaos', label: 'Stress Chaos' },
];

export class QueryEditor extends PureComponent<Props> {
  query: ChaosEventsQuery;

  constructor(props: Props) {
    super(props);

    this.query = defaults(this.props.query, defaultQuery);
  }

  onNamespaceChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.query.namespace = event.target.value;
  };

  onKindChange = (item: SelectableValue<string>) => {
    this.query.kind = item.value!;
  };

  onExperimentChange = (event: ChangeEvent<HTMLInputElement>) => {
    this.query.experiment = event.target.value;
  };

  onRunQuery = () => {
    const { query } = this;
    this.props.onChange(query);
    this.props.onRunQuery();
  };

  render() {
    const { namespace, experiment } = this.query;
    const selectedKind = kindOptions.find(o => o.value === this.query.kind);

    return (
      <div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <InlineFormLabel width={12} tooltip="Namespace of Chaos Experiments">
              Experiment Namespace
            </InlineFormLabel>
            <Input
              type="text"
              className="gf-form-input"
              value={namespace}
              onChange={this.onNamespaceChange}
              onBlur={this.onRunQuery}
              placeholder="chaos-testing"
            />
          </div>

          <div className="gf-form">
            <InlineFormLabel width={10} tooltip="Name of the Chaos Experiment">
              Experiment Name
            </InlineFormLabel>
            <Input
              type="text"
              className="gf-form-input"
              value={experiment}
              onChange={this.onExperimentChange}
              onBlur={this.onRunQuery}
            />
          </div>
        </div>

        <div className="gf-form">
          <InlineFormLabel width={8}>Chaos Kind</InlineFormLabel>
          <Select
            width={8}
            value={selectedKind}
            onChange={this.onKindChange}
            onBlur={this.onRunQuery}
            options={kindOptions}
            isSearchable={false}
          />
        </div>
      </div>
    );
  }
}
