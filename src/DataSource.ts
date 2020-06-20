import defaults from 'lodash/defaults';

import {
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  MutableDataFrame,
  FieldType,
  AnnotationQueryRequest,
  AnnotationEvent,
} from '@grafana/data';

import { EventsQuery, MyDataSourceOptions, defaultQuery } from './types';

export class DataSource extends DataSourceApi<EventsQuery, MyDataSourceOptions> {
  url: string | undefined;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);
  }

  // private request(experiment_name: string, experiment_namespace: string) {
  //   const options: any = {
  //     url: this.url,
  //     method: 'GET',
  //   };

  //   return this.backendSrv.datasourceRequest(options);
  // }

  async query(options: DataQueryRequest<EventsQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();

    // Return a constant for each query.
    const data = options.targets.map(target => {
      const query = defaults(target, defaultQuery);
      return new MutableDataFrame({
        refId: query.refId,
        fields: [
          { name: 'Start Time', values: [from], type: FieldType.time },
          { name: 'End Time', values: [to], type: FieldType.time },
          { name: 'Kind', values: [query.kind], type: FieldType.string },
          { name: 'Namespace', values: [query.namespace], type: FieldType.string },
          { name: 'Experiment', values: [query.experiment], type: FieldType.string },
        ],
      });
    });

    return { data };
  }

  async testDatasource() {
    // Implement a health check for your data source.
    return {
      status: 'success',
      message: 'Success',
    };
  }

  async annotationQuery(options: AnnotationQueryRequest<EventsQuery>): Promise<AnnotationEvent[]> {
    const events: AnnotationEvent[] = [];

    const date = new Date();

    const event: AnnotationEvent = {
      time: date.valueOf(),
      text: 'foo',
      tags: ['bar'],
    };

    events.push(event);

    return events;
  }
}
