import React, { PureComponent } from 'react';
import { DataSourceHttpSettings } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, DataSourceSettings } from '@grafana/data';
import { MyDataSourceOptions } from './types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  updateDataSourceSettings = (setting: DataSourceSettings<MyDataSourceOptions, {}>) => {
    const { onOptionsChange, options } = this.props;
    const datasourceSettings = {
      ...options,
      ...setting,
    };
    onOptionsChange({ ...options, ...datasourceSettings });
  };

  render() {
    const { options } = this.props;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <DataSourceHttpSettings
            defaultUrl="chaos-dashboard.chaos-testing.svc:2333"
            dataSourceConfig={options}
            onChange={this.updateDataSourceSettings}
            showAccessOptions={true}
          />
        </div>
      </div>
    );
  }
}
