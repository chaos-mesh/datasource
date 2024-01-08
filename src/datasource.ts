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
  AnnotationQuery,
  AnnotationSupport,
  DataFrame,
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
  isFetchError,
} from '@grafana/runtime'
import _ from 'lodash'
import { lastValueFrom, of } from 'rxjs'
import { processMultipleVariables, processVariables } from 'utils'

import {
  ChaosMeshOptions,
  ChaosMeshVariableQuery,
  Event,
  EventQuery,
  kinds,
} from './types'

export class DataSource extends DataSourceApi<EventQuery, ChaosMeshOptions> {
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

  private fetchEvents(query: Partial<EventQuery>) {
    return this.fetch<Event[]>({
      url: '/events',
      params: query,
    })
  }

  async query(
    options: DataQueryRequest<EventQuery>
  ): Promise<DataQueryResponse> {
    const { range, scopedVars } = options
    const from = range.from.toISOString()
    const to = range.to.toISOString()

    return Promise.all(
      options.targets.map(async (query) => {
        processVariables(query, scopedVars)

        query.start = from
        query.end = to

        const queries = processMultipleVariables(query)
        const frame = new MutableDataFrame<Event>({
          refId: query.refId,
          fields: this.fields,
        })

        for (const q of queries) {
          ;(await this.fetchEvents(q)).data.forEach((d) => frame.add(d))
        }

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

  annotations: AnnotationSupport<EventQuery> = {
    processEvents: (anno, data) => {
      return of(this.eventFrameToAnnotation(anno, data))
    },
  }

  private eventFrameToAnnotation(
    anno: AnnotationQuery<EventQuery>,
    data: DataFrame[]
  ): AnnotationEvent[] {
    return data.map((frame) => {
      const times = frame.fields
        .find((f) => f.name === 'created_at')!
        .values.reverse() // Default descending order. So reverse it.
      const startTime = Date.parse(times[0])
      const endTime = Date.parse(times[times.length - 1])
      const names = frame.fields
        .find((f) => f.name === 'name')!
        .values.reverse()
      const messages = frame.fields
        .find((f) => f.name === 'message')!
        .values.reverse()

      return {
        title: `<div><b>${anno.name}</b></div>`,
        time: startTime,
        timeEnd: endTime,
        text: `<ul style="max-height: 500px; margin-bottom: 1rem; overflow: auto;">
        ${messages
          .map(
            (d, i) =>
              `<li style="margin-bottom: .5rem;">
                <div>${i + 1}: ${d}</div>
                <div>
                  <span class="label">${names[i]}</span>
                  <span class="label">${new Date(
                    times[i]
                  ).toLocaleTimeString()}</span>
                </div>
              </li>`
          )
          .join('')}
        </ul>`,
        tags: ['Chaos Mesh'],
      }
    })
  }

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
