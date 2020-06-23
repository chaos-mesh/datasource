import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './DataSource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { ChaosEventsQuery, MyDataSourceOptions } from './types';
import { AnnotationsQueryCtrl } from './AnnotationsQueryCtrl';

export const plugin = new DataSourcePlugin<DataSource, ChaosEventsQuery, MyDataSourceOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setAnnotationQueryCtrl(AnnotationsQueryCtrl);
