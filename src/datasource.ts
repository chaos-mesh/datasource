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
import { lastValueFrom } from 'rxjs';

import { ChaosMeshOptions, Event, EventsQuery } from './types';

const timeformat = 'YYYY-MM-DDTHH:mm:ssZ';

export class DataSource extends DataSourceApi<EventsQuery, ChaosMeshOptions> {
  readonly endpoint: string;

  constructor(instanceSettings: DataSourceInstanceSettings<ChaosMeshOptions>) {
    super(instanceSettings);

    this.endpoint = instanceSettings.url + '/api';
  }

  private fetch<T>(url: string, params?: Partial<EventsQuery>) {
    const resp = getBackendSrv().fetch<T>({
      method: 'GET',
      url: this.endpoint + url,
      params,
    });

    return lastValueFrom(resp).then(({ data }) => data);
  }

  private fetchEvents(query: Partial<EventsQuery>) {
    return this.fetch<Event[]>('/events', query);
  }

  /**
   * This function use a tricky way to apply all the variables to the query.
   *
   * It firstly joins all values to a string and then replace by scoped vars, then zip the result to a object.
   *
   * @param query
   * @param scopedVars
   * @returns
   */
  private applyVariables(query: EventsQuery, scopedVars: ScopedVars) {
    const keys = _.keys(query);
    const values = getTemplateSrv()
      .replace(_.values(query).join('|'), scopedVars)
      .split('|');

    return _.zipObject(keys, values) as unknown as EventsQuery;
  }

  async query(
    options: DataQueryRequest<EventsQuery>
  ): Promise<DataQueryResponse> {
    const { range, scopedVars } = options;

    const from = range.from.utc().format(timeformat);
    const to = range.to.utc().format(timeformat);

    return Promise.all(
      options.targets.map(async (query) => {
        query.start = from;
        query.end = to;

        const frame = new MutableDataFrame<Event>({
          refId: query.refId,
          fields: [
            { name: 'object_id', type: FieldType.string },
            { name: 'namespace', type: FieldType.string },
            { name: 'name', type: FieldType.string },
            { name: 'kind', type: FieldType.string },
            { name: 'created_at', type: FieldType.time },
            { name: 'type', type: FieldType.string },
            { name: 'reason', type: FieldType.string },
            { name: 'message', type: FieldType.string },
          ],
        });

        (
          await this.fetchEvents(this.applyVariables(query, scopedVars))
        ).forEach((d) => frame.add(d));

        return frame;
      })
    ).then((data) => ({ data }));
  }

  async testDatasource() {
    return getBackendSrv()
      .get(this.endpoint + '/common/config')
      .then(() => {
        return {
          status: 'success',
          message: 'Chaos Mesh API status is normal.',
        };
      })
      .catch((error) => {
        const { data } = error;

        return {
          status: 'error',
          message: data
            ? data.message
            : error.statusText
            ? error.statusText
            : 'Chaos Mesh API is not available.',
        };
      });
  }

  // async annotationQuery(options: AnnotationQueryRequest<EventsQuery>): Promise<AnnotationEvent[]> {
  //   const { range, annotation: query } = options;

  //   const from = range.from.utc().format(timeformat);
  //   const to = range.to.utc().format(timeformat);

  //   const vars = _.mapValues(
  //     _.keyBy(getTemplateSrv().getVariables(), (d) => '$' + d.name),
  //     'current.value'
  //   );

  //   const queryCloned = _.merge({}, query); // Clone query to avoid mutating it.
  //   for (const q in queryCloned) {
  //     if (!queryCloned.hasOwnProperty(q)) {
  //       continue;
  //     }

  //     const val = (queryCloned as any)[q];

  //     // Handle variables.
  //     if (typeof val === 'string' && val.startsWith('$') && vars[val]) {
  //       (queryCloned as any)[q] = vars[val];
  //     }
  //   }

  //   queryCloned.start = from;
  //   queryCloned.end = to;

  //   return this.fetchEvents({ ...queryCloned, name: (queryCloned as any).eventName }).then((data) => {
  //     const grouped = _.groupBy(data, 'name');

  //     return _.entries(grouped).map(([k, v]) => {
  //       const first = v[v.length - 1];
  //       const last = v[0];

  //       return {
  //         title: `<h6>${k}</h6>`,
  //         text: v
  //           .map((d) => `<div>${new Date(d.created_at).toLocaleString()}: ${d.message}</div>`)
  //           .reverse()
  //           .join('\n'),
  //         tags: [`namespace:${first.namespace}`, `kind:${first.kind}`],
  //         time: Date.parse(first.created_at),
  //         timeEnd: Date.parse(last.created_at),
  //       };
  //     });
  //   });
  // }

  // async metricFindQuery(query: VariableQuery) {
  //   switch (query.metric) {
  //     case 'namespace':
  //       return this.fetch<string[]>('/common/namespaces').then((data) => data.map((d) => ({ text: d })));
  //     case 'kind':
  //       return kinds.map((d) => ({ text: d }));
  //     case 'experiment':
  //     case 'schedule':
  //     case 'workflow':
  //       return this.fetch<Array<{ name: string }>>(`/${query.metric}s${query.queryString || ''}`).then((data) =>
  //         data.map((d) => ({ text: d.name }))
  //       );
  //     default:
  //       return [];
  //   }
  // }
}
