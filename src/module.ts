import { AnnotationQueryEditor } from './AnnotationQueryEditor';
import { ConfigEditor } from './ConfigEditor';
import { DataSource } from './DataSource';
import { DataSourcePlugin } from '@grafana/data';
import { QueryEditor } from './QueryEditor';
import { VariableQueryEditor } from './VariableQueryEditor';

export const plugin = new DataSourcePlugin(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setAnnotationQueryCtrl(AnnotationQueryEditor)
  .setVariableQueryEditor(VariableQueryEditor);
