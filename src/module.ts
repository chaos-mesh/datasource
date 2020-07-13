import { DataSourcePlugin } from '@grafana/data';
import { DataSource } from './DataSource';
import { ConfigEditor } from './ConfigEditor';
import { QueryEditor } from './QueryEditor';
import { ChaosEventsQuery, ChaosMeshOptions } from './types';
import { AnnotationsQueryCtrl } from './AnnotationsQueryCtrl';

export const plugin = new DataSourcePlugin<DataSource, ChaosEventsQuery, ChaosMeshOptions>(DataSource)
  .setConfigEditor(ConfigEditor)
  .setQueryEditor(QueryEditor)
  .setAnnotationQueryCtrl(AnnotationsQueryCtrl);
