import defaults from 'lodash/defaults';

import {
  AnnotationEvent,
  AnnotationQueryRequest,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
} from '@grafana/data';

import { getBackendSrv } from '@grafana/runtime';

import { defaultQuery, EventsQuery, MyDataSourceOptions } from './types';

export class DataSource extends DataSourceApi<EventsQuery, MyDataSourceOptions> {
  url: string;

  constructor(instanceSettings: DataSourceInstanceSettings<MyDataSourceOptions>) {
    super(instanceSettings);

    this.url = instanceSettings.url!;
  }

  _request(url: string, data: Record<string, string> = {}) {
    const options = {
      url: this.url + url,
      method: 'GET',
    };

    if (data && Object.keys(data).length) {
      options.url =
        options.url +
        '?' +
        Object.entries(data)
          .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(v)}`)
          .join('&');
    }

    return getBackendSrv().datasourceRequest(options);
  }

  checkLiveness() {
    const url = '/api/common/namespaces';

    return this._request(url).catch((err: any) => {
      if (err.cancelled) {
        return err;
      }
    });
  }

  // TODO: support start time and finish time filter
  queryEvents(req: EventsQuery) {
    const url = '/api/events';
    const data: any = {
      // startTime: req.startTime,
      kind: req.kind,
    };

    if (req.experiment !== undefined && req.experiment !== '') {
      data.experimentName = req.experiment;
    }
    if (req.namespace !== undefined && req.namespace !== '') {
      data.experimentNamespace = req.namespace;
    }

    return this._request(url, data).catch((err: any) => {
      if (err.cancelled) {
        return err;
      }
    });
  }

  async query(options: DataQueryRequest<EventsQuery>): Promise<DataQueryResponse> {
    const { range } = options;
    const from = range!.from.valueOf();
    const to = range!.to.valueOf();
    console.log(from, to);

    const data = options.targets.map(target => {
      const query = defaults(target, defaultQuery);
      const frame = new MutableDataFrame({
        refId: query.refId,
        fields: [
          { name: 'Kind', type: FieldType.string },
          { name: 'Namespace', type: FieldType.string },
          { name: 'Experiment', type: FieldType.string },
          { name: 'Start Time', type: FieldType.time },
          { name: 'Finish Time', type: FieldType.time },
        ],
      });
      this.queryEvents(query).then((results: any) => {
        for (let event of results.data) {
          const value: any = {};
          value.Kind = event.Kind;
          value['Start Time'] = event.StartTime;
          value['Finish Time'] = event.FinishTime;
          value.Namespace = event.Namespace;
          value.Experiment = event.Experiment;
          frame.add(value);
        }
      });
      return frame;
    });

    return { data };
  }

  async testDatasource() {
    // Implement a health check for your data source.

    const response = await this.checkLiveness();
    return response.status === 200
      ? { status: 'success', message: 'Data source is working' }
      : { status: 'error', message: response.error };
  }

  async annotationQuery(options: AnnotationQueryRequest<EventsQuery>): Promise<AnnotationEvent[]> {
    const query = defaults(options.annotation, defaultQuery);
    return this.queryEvents(query).then((results: any) => {
      const events: AnnotationEvent[] = [];
      for (let event of results.data) {
        const regionEvent: AnnotationEvent = {
          time: Date.parse(event.StartTime),
          timeEnd: Date.parse(event.FinishTime),
          isRegion: true,
          text: `${event.Namespace}-${event.Experiment}`,
          tags: [event.Kind],
        };
        events.push(regionEvent);
      }
      return events;
    });
  }
}
