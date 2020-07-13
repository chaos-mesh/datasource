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

  render() {
    const { options } = this.props;
    const { url } = options;

    return (
      <div className="gf-form-group">
        <h3 className="page-heading">HTTP</h3>
        <div className="gf-form">
          <FormField
            label="URL"
            labelWidth={11}
            onChange={this.onURLChange}
            value={url || ''}
            tooltip="Specify a complete HTTP URL (for example http://your_server:2333);"
            placeholder="http://localhost:2333"
          />
        </div>
      </div>
    );
  }
}
