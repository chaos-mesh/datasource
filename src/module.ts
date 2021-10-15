import { ChaosMeshDataSourceOptions, EventsQuery } from './types';

import { AnnotationQueryEditor } from 'AnnotationQueryEditor';
import { ConfigEditor } from './ConfigEditor';
import { DataSource } from './datasource';
import { DataSourcePlugin } from '@grafana/data';
import { QueryEditor } from './QueryEditor';
import { VariableQueryEditor } from './VariableQueryEditor';

export const plugin = new DataSourcePlugin<DataSource, EventsQuery, ChaosMeshDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setVariableQueryEditor(VariableQueryEditor)
  .setAnnotationQueryCtrl(AnnotationQueryEditor);
