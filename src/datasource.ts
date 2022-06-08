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
import {
  AnnotationEvent,
  AnnotationQueryRequest,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
  ScopedVars,
} from '@grafana/data';
import { getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import _ from 'lodash';

import { ChaosMeshDataSourceOptions, Event, EventsQuery, VariableQuery, defaultQuery, kinds } from './types';

const timeformat = 'YYYY-MM-DDTHH:mm:ssZ';

export class DataSource extends DataSourceApi<EventsQuery, ChaosMeshDataSourceOptions> {
  readonly url?: string;

  constructor(instanceSettings: DataSourceInstanceSettings<ChaosMeshDataSourceOptions>) {
    super(instanceSettings);

    this.url = instanceSettings.url;
  }

  private async fetch<T>(url: string, query?: Partial<EventsQuery>): Promise<T> {
    const data = await getBackendSrv().get(this.url + url, query);

    return data;
  }

  private async fetchEvents(query: Partial<EventsQuery>) {
    return await this.fetch<Event[]>('/api/events', query);
  }

  private applyVariables(query: EventsQuery, scopedVars: ScopedVars) {
    const keys = Object.keys(query);
    // prettier-ignore
    const values = getTemplateSrv()
      .replace(Object.values(query).join('|'), scopedVars)
      .split('|');

    // prettier-ignore
    return (_.zipObject(keys, values) as unknown) as EventsQuery;
  }

  async query(options: DataQueryRequest<EventsQuery>): Promise<DataQueryResponse> {
    const { range, scopedVars } = options;

    const from = range.from.utc().format(timeformat);
    const to = range.to.utc().format(timeformat);

    // Return a constant for each query.
    const data = await Promise.all(
      options.targets.map(async target => {
        const query = this.applyVariables(_.defaults(target, defaultQuery), scopedVars);
        query.start = from;
        query.end = to;

        const frame = new MutableDataFrame<Event>({
          refId: query.refId,
          fields: [
            { name: 'object_id', type: FieldType.string },
            { name: 'created_at', type: FieldType.time },
            { name: 'namespace', type: FieldType.string },
            { name: 'name', type: FieldType.string },
            { name: 'kind', type: FieldType.string },
            { name: 'type', type: FieldType.string },
            { name: 'reason', type: FieldType.string },
            { name: 'message', type: FieldType.string },
          ],
        });

        (await this.fetchEvents(query)).forEach(d => {
          frame.add(d);
        });

        return frame;
      })
    );

    return { data };
  }

  async testDatasource() {
    try {
      await getBackendSrv().get(this.url + '/api/common/config');

      return {
        status: 'success',
        message: 'Chaos Mesh API status is normal',
      };
    } catch (error) {
      return {
        status: 'error',
        message: (error as any).message,
      };
    }
  }

  // https://grafana.com/docs/grafana/latest/developers/plugins/add-support-for-annotations/
  // This will support annotation queries for 7.2+
  annotations = {};

  async annotationQuery(options: AnnotationQueryRequest<EventsQuery>): Promise<AnnotationEvent[]> {
    const { range, annotation } = options;
    const from = range.from.utc().format(timeformat);
    const to = range.to.utc().format(timeformat);

    const query = _.defaults(annotation, defaultQuery);
    const vars = getTemplateSrv()
      .getVariables()
      .map((d: any) => {
        const { name, current } = d;

        const key = `$${name}`;
        const value = current.value;

        return { key, value };
      });

    const keys = vars.map(d => d.key);
    for (const q in query) {
      const variableValue = (query as any)[q];

      if (
        query.hasOwnProperty(q) &&
        typeof variableValue === 'string' &&
        variableValue.startsWith('$') &&
        keys.includes(variableValue)
      ) {
        (query as any)[q] = vars.find(d => d.key === variableValue)?.value;
      }
    }

    query.start = from;
    query.end = to;

    const data = await this.fetchEvents({ ...query, name: (query as any).nname });
    const grouped = _.groupBy(data, d => d.name);

    return Object.entries(grouped).map(([k, v]) => {
      const first = v[v.length - 1];
      const last = v[0];

      return {
        title: k,
        text: v
          .map(d => `${d.created_at}: ${d.message}`)
          .reverse()
          .join('\n'),
        tags: [`namespace:${first.namespace}`, `kind:${first.kind}`],
        time: Date.parse(first.created_at),
        timeEnd: Date.parse(last.created_at),
      };
    });
  }

  async metricFindQuery(query: VariableQuery) {
    switch (query.metric) {
      case 'namespace':
        return (await this.fetch<string[]>('/api/common/namespaces')).map(d => ({ text: d }));
      case 'kind':
        return kinds.map(d => ({ text: d }));
      case 'experiment':
        return (await this.fetch<string[]>('/api/experiments')).map((d: any) => ({ text: d.name }));
      case 'schedule':
        return (await this.fetch<string[]>('/api/schedules')).map((d: any) => ({ text: d.name }));
      default:
        return [];
    }
  }
}
