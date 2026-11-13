import {
  AnnotationQuery,
  DataQueryRequest,
  DataSourceInstanceSettings,
  Field,
  FieldType,
  createDataFrame,
  dateTime,
} from '@grafana/data'
import { Subject, lastValueFrom, of, throwError } from 'rxjs'

import { DataSource } from './datasource'
import { ChaosMeshOptions, EventQuery } from './types'

const fetch = jest.fn()
const replace = jest.fn()

jest.mock('@grafana/runtime', () => ({
  isFetchError: jest.requireActual('@grafana/runtime').isFetchError,
  getBackendSrv: () => ({ fetch }),
  getTemplateSrv: () => ({ replace }),
}))

let datasource: DataSource

beforeEach(() => {
  fetch.mockReset()
  replace.mockReset()
  datasource = new DataSource({
    url: '/proxy',
  } as DataSourceInstanceSettings<ChaosMeshOptions>)
})

test('reusing a query follows changed template variables without changing the saved query', async () => {
  fetch
    .mockReturnValueOnce(of({ data: { version: 'v2.8.9' } }))
    .mockReturnValue(of({ data: { events: [], next_page: null } }))
  replace.mockReturnValueOnce('first').mockReturnValueOnce('second')
  const query = { refId: 'A', namespace: '$namespace' } as EventQuery
  const request = {
    targets: [query],
    range: { from: dateTime(0), to: dateTime(1000) },
    scopedVars: {},
  } as DataQueryRequest<EventQuery>

  await datasource.query(request)
  await datasource.query(request)

  expect(fetch.mock.calls.map(([options]) => options.url)).toEqual([
    configPath,
    pagePath,
    pagePath,
  ])
  expect(
    fetch.mock.calls.slice(1).map(([options]) => options.params.namespace)
  ).toEqual(['first', 'second'])
  expect(query).toEqual({ refId: 'A', namespace: '$namespace' })
})

test('reusing a frame produces the same annotation without reversing its rows', async () => {
  const frame = createDataFrame({
    fields: [
      {
        name: 'created_at',
        type: FieldType.time,
        values: [4000, 1000, 3000, 2000],
      },
      {
        name: 'name',
        type: FieldType.string,
        values: ['fourth', 'first', 'third', 'second'],
      },
      {
        name: 'message',
        type: FieldType.string,
        values: ['fourth event', 'first event', 'third event', 'second event'],
      },
    ],
  })
  const annotation = { name: 'events' } as AnnotationQuery<EventQuery>

  const first = await lastValueFrom(
    datasource.annotations.processEvents!(annotation, [frame])
  )
  const second = await lastValueFrom(
    datasource.annotations.processEvents!(annotation, [frame])
  )

  expect(second).toEqual(first)
  expect(first).toEqual([
    expect.objectContaining({ time: 1000, timeEnd: 4000 }),
  ])
  expect(frame.fields.map((field) => field.values)).toEqual([
    [4000, 1000, 3000, 2000],
    ['fourth', 'first', 'third', 'second'],
    ['fourth event', 'first event', 'third event', 'second event'],
  ])
})

test('empty event results produce no annotations', async () => {
  const frame = createDataFrame({
    fields: [
      { name: 'created_at', type: FieldType.time, values: [] },
      { name: 'name', type: FieldType.string, values: [] },
      { name: 'message', type: FieldType.string, values: [] },
    ],
  })
  const result = await lastValueFrom(
    datasource.annotations.processEvents!(
      { name: 'events' } as AnnotationQuery<EventQuery>,
      [frame]
    )
  )
  expect(result).toEqual([])
})

async function queryEventNames(target: Partial<EventQuery>) {
  const response = await datasource.query({
    targets: [{ refId: 'A', ...target }],
    range: { from: dateTime(0), to: dateTime(5000) },
    scopedVars: {},
  } as DataQueryRequest<EventQuery>)
  return response.data[0].fields.find((field: Field) => field.name === 'name')
    ?.values
}

const configPath = '/proxy/api/common/config'
const pagePath = '/proxy/api/events/page'
const legacyPath = '/proxy/api/events'
const event = (name: string, time: number) => ({
  name,
  created_at: new Date(time).toISOString(),
})

test.each([
  { version: 'v2.8.8', path: legacyPath },
  { version: 'v2.8.9', path: pagePath },
  { version: '2.8.10', path: pagePath },
  { version: 'v2.9.0', path: pagePath },
  { version: 'v3.0.0', path: pagePath },
])('Dashboard version $version selects $path', async ({ version, path }) => {
  const events = [event('latest', 4000)]
  fetch
    .mockReturnValueOnce(of({ data: { version } }))
    .mockReturnValueOnce(
      of({ data: path === pagePath ? { events, next_page: null } : events })
    )

  await expect(queryEventNames({})).resolves.toEqual(['latest'])
  expect(fetch.mock.calls.map(([options]) => options.url)).toEqual([
    configPath,
    path,
  ])
})

test('concurrent queries share the pending Dashboard config request', async () => {
  const config = new Subject<{ data: { version: string } }>()
  fetch
    .mockReturnValueOnce(config)
    .mockReturnValue(
      of({ data: { events: [event('latest', 4000)], next_page: null } })
    )

  const first = queryEventNames({})
  const second = queryEventNames({})
  expect(fetch.mock.calls.map(([options]) => options.url)).toEqual([configPath])

  config.next({ data: { version: 'v2.8.9' } })
  config.complete()

  await expect(Promise.all([first, second])).resolves.toEqual([
    ['latest'],
    ['latest'],
  ])
  expect(fetch.mock.calls.map(([options]) => options.url)).toEqual([
    configPath,
    pagePath,
    pagePath,
  ])
})

test('a failed config request is retried only by the next query', async () => {
  const error = { status: 503, data: {} }
  fetch
    .mockReturnValueOnce(throwError(() => error))
    .mockReturnValueOnce(of({ data: { version: 'v2.8.9' } }))
    .mockReturnValueOnce(of({ data: { events: [], next_page: null } }))

  await expect(queryEventNames({})).rejects.toBe(error)
  expect(fetch.mock.calls.map(([options]) => options.url)).toEqual([configPath])

  await expect(queryEventNames({})).resolves.toEqual([])
  expect(fetch.mock.calls.map(([options]) => options.url)).toEqual([
    configPath,
    configPath,
    pagePath,
  ])
})

test('Save and test makes a fresh request after queries cache the API choice', async () => {
  fetch
    .mockReturnValueOnce(of({ data: { version: 'v2.8.9' } }))
    .mockReturnValueOnce(of({ data: { events: [], next_page: null } }))
    .mockReturnValueOnce(throwError(() => ({ status: 503, data: {} })))

  await queryEventNames({})
  await expect(datasource.testDatasource()).resolves.toEqual(
    expect.objectContaining({ status: 'error' })
  )
  expect(fetch.mock.calls.map(([options]) => options.url)).toEqual([
    configPath,
    pagePath,
    configPath,
  ])
})

test('legacy queries preserve the global newest event limit', async () => {
  replace.mockReturnValue('["first","second"]')
  fetch.mockReturnValueOnce(of({ data: { version: 'v2.8.8' } }))
  fetch.mockImplementation(({ params }) => {
    const events =
      params.namespace === 'first'
        ? [event('oldest', 1000), event('newer', 3000)]
        : [event('older', 2000), event('newest', 4000)]
    return of({ data: events.slice(0, params.limit) })
  })

  await expect(
    queryEventNames({ namespace: '$namespace', limit: 1 })
  ).resolves.toEqual(['newest'])
  expect(fetch.mock.calls.map(([options]) => options.url)).toEqual([
    configPath,
    legacyPath,
    legacyPath,
  ])
})

test('a multi-value query requests the global newest events in one page', async () => {
  replace
    .mockReturnValueOnce('["first","second"]')
    .mockReturnValueOnce('["PodChaos","NetworkChaos"]')
  fetch
    .mockReturnValueOnce(of({ data: { version: 'v2.8.9' } }))
    .mockReturnValue(
      of({ data: { events: [event('newest', 4000)], next_page: 2 } })
    )

  await expect(
    queryEventNames({ namespace: '$namespace', kind: '$kind', limit: 1 })
  ).resolves.toEqual(['newest'])
  expect(fetch).toHaveBeenCalledTimes(2)
  expect(fetch).toHaveBeenCalledWith(
    expect.objectContaining({
      url: pagePath,
      params: {
        namespace: ['first', 'second'],
        kind: ['PodChaos', 'NetworkChaos'],
        start: new Date(0).toISOString(),
        end: new Date(5000).toISOString(),
        page: 1,
        limit: 1,
        sort: 'created_at',
        order: 'desc',
      },
    })
  )
})

test.each([
  { limit: 1001, length: 1001, last: 'second page' },
  { limit: undefined, length: 1002, last: 'last event' },
])(
  'a query with total limit $limit reads subsequent pages at the same size',
  async ({ limit, length, last }) => {
    fetch
      .mockReturnValueOnce(of({ data: { version: 'v2.8.9' } }))
      .mockReturnValueOnce(
        of({
          data: {
            events: Array.from({ length: 1000 }, (_, i) =>
              event('first page', 4000 - i)
            ),
            next_page: 2,
          },
        })
      )
      .mockReturnValueOnce(
        of({
          data: {
            events: [event('second page', 1000), event('last event', 500)],
            next_page: null,
          },
        })
      )

    const names = await queryEventNames({ limit })

    expect(names).toHaveLength(length)
    expect(names?.at(-1)).toBe(last)
    expect(
      fetch.mock.calls
        .slice(1)
        .map(([{ params }]) => [params.page, params.limit])
    ).toEqual([
      [1, 1000],
      [2, 1000],
    ])
  }
)

test.each([{ limit: 0 }, { namespace: '$namespace' }])(
  'a query with %j produces no rows or requests',
  async (target) => {
    replace.mockReturnValue('[]')
    await expect(queryEventNames(target)).resolves.toEqual([])
    expect(fetch).not.toHaveBeenCalled()
  }
)

test.each([
  {
    page: 1,
    error: {
      status: 400,
      data: { type: 'error.api.bad_request', message: 'invalid limit' },
    },
  },
  { page: 1, error: { status: 401, data: {} } },
  { page: 1, error: { status: 404, data: {} } },
  {
    page: 1,
    error: {
      status: 400,
      data: { type: 'error.api.bad_request', message: 'ID is not a number' },
    },
  },
  { page: 2, error: { status: 404, data: {} } },
])(
  'page $page with error $error.status fails the query',
  async ({ page, error }) => {
    fetch.mockReturnValueOnce(of({ data: { version: 'v2.8.9' } }))
    if (page === 2) {
      fetch.mockReturnValueOnce(of({ data: { events: [], next_page: 2 } }))
    }
    fetch.mockReturnValueOnce(throwError(() => error))

    await expect(queryEventNames({})).rejects.toBe(error)
    expect(fetch.mock.calls.map(([options]) => options.url)).toEqual([
      configPath,
      ...Array(page).fill(pagePath),
    ])
  }
)
