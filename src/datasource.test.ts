import {
  DataQueryRequest,
  DataSourceInstanceSettings,
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

test.each([
  { version: 'v2.8.8', enhanced: false },
  { version: 'v2.8.9', enhanced: true },
])(
  'uses the Events API supported by $version',
  async ({ version, enhanced }) => {
    fetch.mockReset()
    replace.mockReset()
    fetch.mockReturnValueOnce(of({ data: { version } })).mockReturnValue(
      of({
        data: [{ name: 'experiment', created_at: '2026-11-12T00:00:00Z' }],
      })
    )
    replace.mockReturnValue('["first","second"]')
    const datasource = new DataSource({
      url: '/proxy',
    } as DataSourceInstanceSettings<ChaosMeshOptions>)
    const target = { refId: 'A', name: '$experiment', limit: 1 }
    const request = {
      targets: [target],
      range: { from: dateTime(0), to: dateTime(1000) },
      scopedVars: {},
    } as DataQueryRequest<EventQuery>

    const response = await datasource.query(request)
    await datasource.query(request)

    const config = '/proxy/api/common/config'
    const events = '/proxy/api/events'
    expect(fetch.mock.calls.map(([{ url }]) => url)).toEqual(
      enhanced
        ? [config, events, events]
        : [config, events, events, events, events]
    )
    expect(fetch.mock.calls.slice(1).map(([{ params }]) => params)).toEqual(
      enhanced
        ? Array.from({ length: 2 }, () =>
            expect.objectContaining({
              name: ['first', 'second'],
              sort: 'created_at',
              order: 'desc',
              limit: 1,
            })
          )
        : ['first', 'second', 'first', 'second'].map((name) =>
            expect.objectContaining({ name, limit: 1 })
          )
    )
    expect(response.data[0].length).toBe(enhanced ? 1 : 2)
    expect(target.name).toBe('$experiment')
  }
)

test('queries variables when Grafana calls the query callback on its own', async () => {
  fetch.mockReset()
  fetch.mockReturnValue(of({ data: ['test-namespace'] }))
  const datasource = new DataSource({
    url: '/proxy',
  } as DataSourceInstanceSettings<ChaosMeshOptions>)
  const { query } = datasource.variables
  const request = {
    targets: [{ refId: 'variable-query', metric: 'namespace' }],
  } as Parameters<typeof query>[0]

  await expect(lastValueFrom(query(request))).resolves.toEqual({
    data: [{ text: 'test-namespace' }],
  })
})
