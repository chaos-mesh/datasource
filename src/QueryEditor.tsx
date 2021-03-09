import { ChaosMeshOptions, ChaosMeshQuery, ExperimentKind, defaultQuery, kindOptions } from './types';
import { InlineFormLabel, LegacyForms } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import React, { PureComponent, SyntheticEvent } from 'react';

import { DataSource } from './DataSource';
import defaults from 'lodash/defaults';

const { Input, Select } = LegacyForms;
const MarginRight4: React.FC = ({ children }) => <div style={{ marginRight: 4 }}>{children}</div>;

type Props = QueryEditorProps<DataSource, ChaosMeshQuery, ChaosMeshOptions>;

interface State {
  dnsServerCreate: boolean;
  availableNamespaces: Array<SelectableValue<string>>;
  experimentName: string;
  namespace: string;
  kind: ExperimentKind;
}

export class QueryEditor extends PureComponent<Props, State> {
  query: ChaosMeshQuery;
  datasource: DataSource;

  constructor(props: Props) {
    super(props);

    this.query = defaults(this.props.query, defaultQuery);
    this.datasource = this.props.datasource;
    this.state = {
      dnsServerCreate: false,
      availableNamespaces: [],
      experimentName: this.query.experimentName || '',
      namespace: this.query.namespace || 'default',
      kind: this.query.kind || 'PodChaos',
    };
  }

  componentDidMount() {
    this.datasource
      .fetchAvailableNamespaces()
      .then(({ data }) => this.setState({ availableNamespaces: data.map(d => ({ label: d, value: d })) }));
    this.datasource.fetchConfig().then(({ data }) => this.setState({ dnsServerCreate: data.dns_server_create }));
  }

  onExperimentNameChange = (e: SyntheticEvent<HTMLInputElement>) => {
    const name = e.currentTarget.value;
    this.query.experimentName = name;
    this.setState({ experimentName: name });
  };

  onNamespaceChange = (option: SelectableValue<string>) => {
    const value = option.value!;

    this.query.namespace = value;
    this.setState({ namespace: value }, this.onRunQuery);
  };

  onKindChange = (option: SelectableValue<ExperimentKind>) => {
    const value = option.value!;

    this.query.kind = value;
    this.setState({ kind: value }, this.onRunQuery);
  };

  onRunQuery = () => {
    this.props.onChange(this.query);
    this.props.onRunQuery();
  };

  render() {
    const { dnsServerCreate, availableNamespaces, experimentName, namespace, kind } = this.state;

    return (
      <div className="gf-form-inline">
        <MarginRight4>
          <div className="gf-form">
            <InlineFormLabel tooltip="Filter chaos events by specifying the name of Experiments.">
              Experiment
            </InlineFormLabel>
            <Input value={experimentName} onChange={this.onExperimentNameChange} onBlur={this.onRunQuery} />
          </div>
        </MarginRight4>
        <MarginRight4>
          <div className="gf-form">
            <InlineFormLabel tooltip="Filter chaos events by choosing the Namespace of Experiments.">
              Namespace
            </InlineFormLabel>
            <Select
              options={availableNamespaces}
              value={availableNamespaces.find(n => n.value === namespace)}
              onChange={this.onNamespaceChange}
            />
          </div>
        </MarginRight4>
        <MarginRight4>
          <div className="gf-form">
            <InlineFormLabel tooltip="Filter chaos events by choosing the Kind of Experiments.">Kind</InlineFormLabel>
            <Select
              options={dnsServerCreate ? kindOptions : kindOptions.filter(kind => kind.value !== 'DNSChaos')}
              value={kindOptions.find(k => k.value === kind)}
              onChange={this.onKindChange}
            />
          </div>
        </MarginRight4>
      </div>
    );
  }
}
