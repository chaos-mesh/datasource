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
import { DataSourcePlugin } from '@grafana/data'

import { ConfigEditor } from './components/ConfigEditor'
import { QueryEditor } from './components/QueryEditor'
import { VariableQueryEditor } from './components/VariableQueryEditor'
import { DataSource } from './datasource'
import { ChaosMeshOptions, EventQuery } from './types'

export const plugin = new DataSourcePlugin<
  DataSource,
  EventQuery,
  ChaosMeshOptions
>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setVariableQueryEditor(VariableQueryEditor)
