import defaults from 'lodash/defaults';

import React, { ChangeEvent, PureComponent } from 'react';
import { InlineFormLabel, LegacyForms } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import { DataSource } from './DataSource';
import { defaultQuery, ChaosMeshOptions, ChaosEventsQuery } from './types';

const { Input, Select } = LegacyForms;

type Props = QueryEditorProps<DataSource, ChaosEventsQuery, ChaosMeshOptions>;

const kindOptions: Array<SelectableValue<string>> = [
  { value: 'PodChaos', label: 'Pod Chaos' },
  { value: 'NetworkChaos', label: 'Network Chaos' },
  { value: 'IOChaos', label: 'IO Chaos' },
  { value: 'TimeChaos', label: 'Time Chaos' },
  { value: 'KernelChaos', label: 'Kernel Chaos' },
  { value: 'StressChaos', label: 'Stress Chaos' },
];

interface State {
  allNamespaces: Array<SelectableValue<string>>;
  namespace: string;
  experiment: string;
  kind: string;
}

export class QueryEditor extends PureComponent<Props, State> {
  query: ChaosEventsQuery;
  dataSource: DataSource;

  constructor(props: Props) {
    super(props);

    this.dataSource = this.props.datasource;
    this.query = defaults(this.props.query, defaultQuery);
    this.state = {
      allNamespaces: [],
      namespace: this.query.namespace!,
      kind: this.query.kind,
      experiment: this.query.experiment!,
    };
  }

  componentDidMount() {
    this.dataSource.queryNamespaces().then((results: any) => {
      this.setState({ allNamespaces: results.data.map((ns: string) => ({ label: ns, value: ns })) });
    });
  }

  onNamespaceChange = (item: SelectableValue<string>) => {
    const namespace = item.value!;
    this.query.namespace = namespace;
    this.setState({ namespace }, this.onRunQuery);
  };

  onKindChange = (item: SelectableValue<string>) => {
    const kind = item.value!;
    this.query.kind = kind;
    this.setState({ kind }, this.onRunQuery);
  };

  onExperimentChange = (event: ChangeEvent<HTMLInputElement>) => {
    const experiment = event.target.value;
    this.query.experiment = experiment;
    this.setState({ experiment });
  };

  onRunQuery = () => {
    const { query } = this;
    this.props.onChange(query);
    this.props.onRunQuery();
  };

  render() {
    const { experiment, allNamespaces } = this.state;
    const selectedKind = kindOptions.find(o => o.value === this.query.kind);
    const selectedNamespace = allNamespaces.find(o => o.value === this.query.namespace);

    return (
      <div>
        <div className="gf-form-inline">
          <div className="gf-form">
            <InlineFormLabel width={12} tooltip="Namespace of Chaos Experiments">
              Experiment Namespace
            </InlineFormLabel>
            <Select
              value={selectedNamespace}
              onChange={this.onNamespaceChange}
              onBlur={this.onRunQuery}
              options={allNamespaces}
              isSearchable={false}
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
