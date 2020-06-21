import React, { ChangeEvent, PureComponent } from 'react';
import { DataSourceHttpSettings } from '@grafana/ui';
import { DataSourcePluginOptionsEditorProps, DataSourceSettings } from '@grafana/data';
import { MyDataSourceOptions } from './types';

interface Props extends DataSourcePluginOptionsEditorProps<MyDataSourceOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  onURLChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    const jsonData = {
      ...options.jsonData,
      directUrl: event.target.value,
    };
    onOptionsChange({ ...options, jsonData });
  };

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
    // const { jsonData } = options;

    return (
      <div className="gf-form-group">
        <div className="gf-form">
          <DataSourceHttpSettings
            defaultUrl="http://historienserver:port/api/grafana/v0"
            dataSourceConfig={options}
            onChange={this.updateDataSourceSettings}
            showAccessOptions={true}
          />
        </div>
      </div>
    );
  }
}
