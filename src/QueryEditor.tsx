import { ChaosMeshDataSourceOptions, EventsQuery, defaultQuery } from './types';
import React, { ChangeEvent, PureComponent } from 'react';

import { DataSource } from './datasource';
import { DebouncedFunc } from 'lodash';
import { LegacyForms } from '@grafana/ui';
import { QueryEditorProps } from '@grafana/data';
import debounce from 'lodash/debounce';
import defaults from 'lodash/defaults';

const { FormField } = LegacyForms;

type Props = QueryEditorProps<DataSource, EventsQuery, ChaosMeshDataSourceOptions>;

export class QueryEditor extends PureComponent<Props> {
  onRunQueryDebounced: DebouncedFunc<any>;

  constructor(props: Props) {
    super(props);

    this.onRunQueryDebounced = debounce(this.props.onRunQuery, 500);
  }

  onChange = (key: keyof EventsQuery) => (event: ChangeEvent<HTMLInputElement>) => {
    const { onChange, query } = this.props;

    let value: string | number = event.target.value;
    if (key === 'limit') {
      value = parseInt(value, 10);
    }

    onChange({ ...query, [key]: value });
    // executes the query
    this.onRunQueryDebounced();
  };

  render() {
    const query = defaults(this.props.query, defaultQuery);
    const { object_id, namespace, name, kind, limit } = query;

    return (
      <div className="gf-form">
        <FormField
          value={object_id || ''}
          onChange={this.onChange('object_id')}
          label="Object ID"
          tooltip="Filter events by Object ID"
        />
        <FormField
          value={namespace || ''}
          onChange={this.onChange('namespace')}
          label="Namespace"
          tooltip="Filter events by Namespace"
        />
        <FormField value={name || ''} onChange={this.onChange('name')} label="Name" tooltip="Filter events by Name" />
        <FormField value={kind || ''} onChange={this.onChange('kind')} label="Kind" tooltip="Filter events by Kind" />
        <FormField
          type="number"
          value={limit}
          onChange={this.onChange('limit')}
          label="Limit"
          tooltip="Filter events by Limit"
        />
      </div>
    );
  }
}
