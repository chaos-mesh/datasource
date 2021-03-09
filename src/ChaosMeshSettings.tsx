import React, { SyntheticEvent } from 'react';

import { ChaosMeshOptions } from './types';
import { DataSourcePluginOptionsEditorProps } from '@grafana/data';
import { LegacyForms } from '@grafana/ui';

const { FormField, Input } = LegacyForms;

const onChangeHandler = (
  key: keyof ChaosMeshOptions,
  options: Props['options'],
  onOptionsChange: Props['onOptionsChange']
) => (e: SyntheticEvent<HTMLInputElement>) => {
  onOptionsChange({
    ...options,
    jsonData: {
      ...options.jsonData,
      [key]: e.currentTarget.value,
    },
  });
};

type Props = Pick<DataSourcePluginOptionsEditorProps<ChaosMeshOptions>, 'options' | 'onOptionsChange'>;

const ChaosMeshSettings: React.FC<Props> = props => {
  const { options, onOptionsChange } = props;

  return (
    <>
      <h3 className="page-heading">Options</h3>
      <div className="gf-form-group">
        <div className="gf-form">
          <FormField
            label="Limit"
            tooltip="Limit the number of returned Chaos Events. The default is 25. If you want to display more events, please increase it."
            inputEl={
              <Input
                value={options.jsonData.limit}
                onChange={onChangeHandler('limit', options, onOptionsChange)}
                placeholder="25"
              />
            }
          />
        </div>
      </div>
    </>
  );
};

export default ChaosMeshSettings;
