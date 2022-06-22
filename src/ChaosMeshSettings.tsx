/*
 * Copyright 2022 Chaos Mesh Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { DataSourcePluginOptionsEditorProps, SelectableValue } from '@grafana/data';
import { LegacyForms } from '@grafana/ui';
import React, { SyntheticEvent } from 'react';

import { ChaosMeshOptions } from './types';

const { Input, FormField } = LegacyForms;

type Props = Pick<DataSourcePluginOptionsEditorProps<ChaosMeshOptions>, 'options' | 'onOptionsChange'>;

export const ChaosMeshSettings = (props: Props) => {
  const { options, onOptionsChange } = props;

  return (
    <>
      <h3 className="page-heading">Events</h3>
      <div className="gf-form-group">
        <div className="gf-form-inline">
          <div className="gf-form">
            <FormField
              label="Limit"
              labelWidth={12}
              inputEl={
                <Input
                  className="width-6"
                  value={options.jsonData.limit}
                  spellCheck={false}
                  placeholder="300"
                  onChange={onChangeHandler('limit', options, onOptionsChange)}
                />
              }
              tooltip="Limit the number of events to be fetched from the Chaos Mesh server. If not set, the default value is 300."
            />
          </div>
        </div>
      </div>
    </>
  );
};

export const getValueFromEvent = (e: SyntheticEvent<HTMLInputElement> | SelectableValue<string>) => {
  if (!e) {
    return '';
  }

  if (e.hasOwnProperty('currentTarget')) {
    return e.currentTarget.value;
  }

  return (e as SelectableValue<string>).value;
};

const onChangeHandler =
  (key: keyof ChaosMeshOptions, options: Props['options'], onOptionsChange: Props['onOptionsChange']) =>
  (e: SyntheticEvent<HTMLInputElement> | SelectableValue<string>) => {
    onOptionsChange({
      ...options,
      jsonData: {
        ...options.jsonData,
        [key]: getValueFromEvent(e),
      },
    });
  };
