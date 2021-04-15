import { ChaosMeshOptions, ChaosMeshQuery, ExperimentKind, defaultQuery, kindOptions } from './types';
import { InlineFormLabel, Input, Select } from '@grafana/ui';
import { QueryEditorProps, SelectableValue } from '@grafana/data';
import React, { PureComponent, SyntheticEvent } from 'react';

import { DataSource } from './DataSource';
import defaults from 'lodash/defaults';

type Props = QueryEditorProps<DataSource, ChaosMeshQuery, ChaosMeshOptions>;

interface State {
  dnsServerCreate: boolean;
  availableNamespaces: Array<SelectableValue<string>>;
  kindCustomOptions: typeof kindOptions;
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
    const { experimentName, namespace, kind } = this.query;
    this.datasource = this.props.datasource;
    this.state = {
      dnsServerCreate: false,
      availableNamespaces: namespace ? [{ label: namespace, value: namespace }] : [],
      kindCustomOptions: kind ? [...kindOptions, { label: kind, value: kind }] : kindOptions,
      experimentName: experimentName || '',
      namespace: namespace || 'default',
      kind: kind || 'PodChaos',
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

  onNamespaceCreateOption = (value: any) => {
    this.query.namespace = value;
    this.setState({
      availableNamespaces: [...this.state.availableNamespaces, { label: value, value }],
      namespace: value,
    });
  };

  onKindChange = (option: SelectableValue<ExperimentKind>) => {
    const value = option.value!;

    this.query.kind = value;
    this.setState({ kind: value }, this.onRunQuery);
  };

  onKindCreateOption = (value: any) => {
    this.query.kind = value;
    this.setState({ kindCustomOptions: [...this.state.kindCustomOptions, { label: value, value }], kind: value });
  };

  onRunQuery = () => {
    this.props.onChange(this.query);
    this.props.onRunQuery();
  };

  render() {
    const { dnsServerCreate, availableNamespaces, kindCustomOptions, experimentName, namespace, kind } = this.state;

    return (
      <div className="gf-form-inline">
        <div className="gf-form" style={{ marginRight: 4 }}>
          <InlineFormLabel tooltip="Filter chaos events by specifying the name of Experiments.">
            Experiment
          </InlineFormLabel>
          <Input value={experimentName} onChange={this.onExperimentNameChange} onBlur={this.onRunQuery} />
        </div>
        <div className="gf-form" style={{ marginRight: 4 }}>
          <InlineFormLabel tooltip="Filter chaos events by choosing the Namespace of Experiments.">
            Namespace
          </InlineFormLabel>
          <Select
            options={availableNamespaces}
            value={namespace}
            onChange={this.onNamespaceChange}
            allowCustomValue
            onCreateOption={this.onNamespaceCreateOption}
          />
        </div>
        <div className="gf-form">
          <InlineFormLabel tooltip="Filter chaos events by choosing the Kind of Experiments.">Kind</InlineFormLabel>
          <Select
            options={dnsServerCreate ? kindCustomOptions : kindCustomOptions.filter(kind => kind.value !== 'DNSChaos')}
            value={kind}
            onChange={this.onKindChange}
            allowCustomValue
            onCreateOption={this.onKindCreateOption}
          />
        </div>
      </div>
    );
  }
}
