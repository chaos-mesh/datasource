import {
  AnnotationQuery,
  DataQueryRequest,
  DataSourceInstanceSettings,
  Field,
  FieldType,
  createDataFrame,
  dateTime,
} from '@grafana/data'
import { lastValueFrom, of } from 'rxjs'

import { DataSource } from './datasource'
import { ChaosMeshOptions, EventQuery } from './types'

const fetch = jest.fn()
const replace = jest.fn()

jest.mock('@grafana/runtime', () => ({
  getBackendSrv: () => ({ fetch }),
  getTemplateSrv: () => ({ replace }),
}))

const datasource = new DataSource({
  url: '/proxy',
} as DataSourceInstanceSettings<ChaosMeshOptions>)

test('reusing a query follows changed template variables without changing the saved query', async () => {
  fetch.mockReturnValue(of({ data: [] }))
  replace.mockReturnValueOnce('first').mockReturnValueOnce('second')
  const query = { refId: 'A', namespace: '$namespace' } as EventQuery
  const request = {
    targets: [query],
    range: { from: dateTime(0), to: dateTime(1000) },
    scopedVars: {},
  } as DataQueryRequest<EventQuery>

  await datasource.query(request)
  await datasource.query(request)

  expect(fetch.mock.calls.map(([options]) => options.params.namespace)).toEqual(
    ['first', 'second']
  )
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

test('a total limit returns the newest events across variable combinations', async () => {
  replace.mockReturnValue('["first","second"]')
  fetch.mockImplementation(({ params }) => {
    const events =
      params.namespace === 'first'
        ? [
            { name: 'oldest', created_at: new Date(1000).toISOString() },
            { name: 'newest', created_at: new Date(4000).toISOString() },
          ]
        : [
            { name: 'older', created_at: new Date(2000).toISOString() },
            { name: 'newer', created_at: new Date(3000).toISOString() },
          ]
    return of({
      data: params.limit === undefined ? events : events.slice(0, params.limit),
    })
  })
  const response = await datasource.query({
    targets: [{ refId: 'A', namespace: '$namespace', limit: 1 }],
    range: { from: dateTime(0), to: dateTime(5000) },
    scopedVars: {},
  } as DataQueryRequest<EventQuery>)

  expect(
    response.data[0].fields.find((field: Field) => field.name === 'name')
      ?.values
  ).toEqual(['newest'])
})
