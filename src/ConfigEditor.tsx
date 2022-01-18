import React, { PureComponent } from 'react';

import { ChaosMeshDataSourceOptions } from './types';
import { DataSourceHttpSettings } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';

interface Props extends DataSourcePluginOptionsEditorProps<ChaosMeshDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  render() {
    const { options, onOptionsChange } = this.props;

    return (
      <DataSourceHttpSettings
        defaultUrl="http://localhost:2333"
        dataSourceConfig={options}
        showAccessOptions={true}
        onChange={onOptionsChange as any}
      />
    );
  }
}
