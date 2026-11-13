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
  createDataFrame,
} from '@grafana/data'
import {
  BackendSrvRequest,
  FetchResponse,
  getBackendSrv,
  isFetchError,
} from '@grafana/runtime'
import _ from 'lodash'
import { lastValueFrom, of } from 'rxjs'
import { processMultipleVariables, processVariables } from 'utils'

import { ChaosMeshVariableSupport } from './components/VariableQueryEditor'
import {
  ChaosMeshOptions,
  ChaosMeshVariableQuery,
  Event,
  EventPageResponse,
  EventQuery,
  kinds,
} from './types'

type EventsApi = 'legacy' | 'paginated'

interface DashboardConfigResponse {
  version?: string
}

export class DataSource extends DataSourceApi<EventQuery, ChaosMeshOptions> {
  variables = new ChaosMeshVariableSupport(this)

  private eventsApi?: Promise<EventsApi>

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

  private async fetchEvents(query: EventQuery, limit?: number) {
    const totalLimit =
      limit !== undefined && limit > 0 ? Math.floor(limit) : undefined
    if (
      limit === 0 ||
      totalLimit === 0 ||
      Object.values(query).some(
        (value) => Array.isArray(value) && value.length === 0
      )
    ) {
      return []
    }

    this.eventsApi ??= this.fetch<DashboardConfigResponse>({
      url: '/common/config',
    })
      .then<EventsApi>(({ data }) => {
        const version = /^v?(\d+)\.(\d+)\.(\d+)$/.exec(data.version ?? '')
        if (!version) {
          return 'legacy'
        }
        const [major, minor, patch] = version.slice(1).map(Number)
        return major > 2 ||
          (major === 2 && (minor > 8 || (minor === 8 && patch >= 9)))
          ? 'paginated'
          : 'legacy'
      })
      .catch((error) => {
        this.eventsApi = undefined
        throw error
      })

    const events: Event[] = []
    if ((await this.eventsApi) === 'legacy') {
      for (const q of processMultipleVariables(query)) {
        const response = await this.fetch<Event[]>({
          url: '/events',
          params: q,
        })
        response.data.forEach((event) => events.push(event))
      }
      if (totalLimit !== undefined) {
        events.sort(
          (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
        )
        events.splice(totalLimit)
      }
      return events
    }

    const params = {
      ..._.pick(query, [
        'object_id',
        'namespace',
        'name',
        'kind',
        'start',
        'end',
      ]),
      limit: Math.min(totalLimit ?? 1000, 1000),
      ...(totalLimit !== undefined
        ? { sort: 'created_at', order: 'desc' }
        : {}),
    }
    let page: number | null = 1
    while (page !== null) {
      const response: FetchResponse<EventPageResponse> = await this.fetch({
        url: '/events/page',
        params: { ...params, page },
      })
      events.push(...response.data.events)
      if (totalLimit !== undefined && events.length >= totalLimit) {
        events.splice(totalLimit)
        return events
      }
      page = response.data.next_page
    }
    return events
  }

  async query(
    options: DataQueryRequest<EventQuery>
  ): Promise<DataQueryResponse> {
    const { range, scopedVars } = options
    const from = range.from.toISOString()
    const to = range.to.toISOString()

    return Promise.all(
      options.targets.map(async (target) => {
        const { limit, ...query } = target
        processVariables(query, scopedVars)

        query.start = from
        query.end = to

        const events = await this.fetchEvents(query, limit)

        return createDataFrame({
          refId: query.refId,
          fields: this.fields.map((field) => ({
            ...field,
            values: events.map((event) =>
              field.type === FieldType.time
                ? Date.parse(event.created_at)
                : event[field.name as keyof Event]
            ),
          })),
        })
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
    return data
      .filter((frame) => frame.length > 0)
      .map((frame) => {
        const times = frame.fields.find((f) => f.name === 'created_at')!.values
        const startTime = _.min(times)
        const endTime = _.max(times)
        const names = frame.fields
          .find((f) => f.name === 'name')!
          .values.slice()
          .reverse()
        const messages = frame.fields
          .find((f) => f.name === 'message')!
          .values.slice()
          .reverse()

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
