import React, { ChangeEvent, PureComponent } from 'react';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { ChaosMeshOptions } from './types';
import { LegacyForms } from '@grafana/ui';

const { FormField } = LegacyForms;

interface Props extends DataSourcePluginOptionsEditorProps<ChaosMeshOptions> {}

interface State {}

export class ConfigEditor extends PureComponent<Props, State> {
  componentDidMount() {
    const { options } = this.props;
    options.jsonData.defaultUrl = options.url;
  }

  onURLChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      url: event.target.value,
      jsonData: {
        ...options.jsonData,
        defaultUrl: event.target.value,
      },
    });
  };

  onLimitChange = (event: ChangeEvent<HTMLInputElement>) => {
    const { onOptionsChange, options } = this.props;
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        limit: parseInt(event.target.value, 10),
      },
    });
  };

  render() {
    const { options } = this.props;
    const { url, jsonData } = options;
    const { limit } = jsonData;

    return (
      <div className="gf-form-group">
        <div className="gf-form-group">
          <h3 className="page-heading">HTTP</h3>
          <div className="gf-form">
            <FormField
              label="URL"
              labelWidth={10}
              inputWidth={13}
              onChange={this.onURLChange}
              value={url || ''}
              tooltip="Specify a complete HTTP URL (for example http://your_server:2333);"
              placeholder="http://localhost:2333"
            />
          </div>
        </div>

        <div className="gf-form-group">
          <h3 className="page-heading">Options</h3>
          <div className="gf-form">
            <FormField
              label="Limit"
              labelWidth={10}
              inputWidth={6}
              onChange={this.onLimitChange}
              value={limit || ''}
              tooltip="Limit the number of returned Chaos Events. Default value is 25. If you want to display more events, please increase the limit."
              placeholder="25"
            />
          </div>
        </div>
      </div>
    );
  }
}
