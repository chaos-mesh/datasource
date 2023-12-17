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
} from '@grafana/data'
import {
  BackendSrvRequest,
  getBackendSrv,
  getTemplateSrv,
  isFetchError,
} from '@grafana/runtime'
import _ from 'lodash'
import { lastValueFrom } from 'rxjs'

import {
  ChaosMeshOptions,
  ChaosMeshVariableQuery,
  Event,
  EventsQuery,
  kinds,
} from './types'

export class DataSource extends DataSourceApi<EventsQuery, ChaosMeshOptions> {
  readonly baseUrl: string
  readonly fields = [
    {
      name: 'object_id',
      type: FieldType.string,
      config: { displayName: 'Object ID' },
    },
    {
      name: 'namespace',
      type: FieldType.string,
      config: { displayName: 'Namespace' },
    },
    {
      name: 'name',
      type: FieldType.string,
      config: { displayName: 'Name' },
    },
    {
      name: 'kind',
      type: FieldType.string,
      config: { displayName: 'Kind' },
    },
    {
      name: 'created_at',
      type: FieldType.time,
      config: { displayName: 'Time' },
    },
    {
      name: 'type',
      type: FieldType.string,
      config: { displayName: 'Type' },
    },
    {
      name: 'reason',
      type: FieldType.string,
      config: { displayName: 'Reason' },
    },
    {
      name: 'message',
      type: FieldType.string,
      config: { displayName: 'Message' },
    },
  ]

  constructor(instanceSettings: DataSourceInstanceSettings<ChaosMeshOptions>) {
    super(instanceSettings)

    this.baseUrl = instanceSettings.url + '/api'
  }

  private fetch<T>(options: BackendSrvRequest) {
    const _options = _.defaults(
      {
        url: this.baseUrl + options.url,
      },
      options,
      {
        method: 'GET',
      }
    )

    const resp = getBackendSrv().fetch<T>(_options)

    return lastValueFrom(resp)
  }

  private fetchEvents(query: Partial<EventsQuery>) {
    return this.fetch<Event[]>({
      url: '/events',
      params: query,
    })
  }

  async query(
    options: DataQueryRequest<EventsQuery>
  ): Promise<DataQueryResponse> {
    const { range, scopedVars } = options
    const from = range.from.toISOString()
    const to = range.to.toISOString()

    return Promise.all(
      options.targets.map(async (query) => {
        for (const [key, value] of Object.entries(query)) {
          if (typeof value === 'string' && value.startsWith('$')) {
            query[key] = getTemplateSrv().replace(query[key], scopedVars)
          }
        }

        query.start = from
        query.end = to

        const frame = new MutableDataFrame<Event>({
          refId: query.refId,
          fields: this.fields,
        })

        ;(await this.fetchEvents(query)).data.forEach((d) => frame.add(d))

        return frame
      })
    ).then((data) => ({ data }))
  }

  async testDatasource() {
    const defaultErrorMessage = 'Cannot connect to API'

    try {
      const resp = await this.fetch({
        url: '/common/config',
      })

      if (resp.status === 200) {
        return {
          status: 'success',
          message: 'Chaos Mesh API is available',
        }
      } else {
        return {
          status: 'error',
          message:
            `Status code: ${resp.status}.` +
            ' Chaos Mesh API is not available.',
        }
      }
    } catch (err) {
      let message = ''
      if (_.isString(err)) {
        message = err
      } else if (isFetchError(err)) {
        message =
          'Fetch error: ' +
          (err.statusText ? err.statusText : defaultErrorMessage)
        if (err.data && err.data.error && err.data.error.code) {
          message += ': ' + err.data.error.code + '. ' + err.data.error.message
        }
      }
      return {
        status: 'error',
        message,
      }
    }
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

  async metricFindQuery(query: ChaosMeshVariableQuery) {
    switch (query.metric) {
      case 'namespace':
        return this.fetch<string[]>({
          url: '/common/chaos-available-namespaces',
        }).then(({ data }) => data.map((d) => ({ text: d })))
      case 'kind':
        return kinds.map((d) => ({ text: d }))
      case 'experiment':
      case 'schedule':
      case 'workflow':
        return this.fetch<Array<{ name: string }>>({
          url: `/${query.metric}s${query.queryString || ''}`,
        }).then(({ data }) => data.map((d) => ({ text: d.name })))
      default:
        return []
    }
  }
}
