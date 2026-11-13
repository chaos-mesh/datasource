import { expect, test } from '@grafana/plugin-e2e'

const namespace = process.env.CHAOS_MESH_TEST_NAMESPACE || 'compat-e2e'
const selectedNamespaces = process.env.CHAOS_MESH_LIVE
  ? [namespace]
  : [namespace, 'canary-e2e']
const experiment = process.env.CHAOS_MESH_TEST_EXPERIMENT || 'experiment-a'
const datasource = { type: 'chaosmeshorg-datasource', uid: 'chaosmesh-compat' }

test.beforeAll(async ({ request }) => {
  const response = await request.post('/api/dashboards/db', {
    data: {
      overwrite: true,
      dashboard: {
        uid: 'chaosmesh-compat',
        title: 'Chaos Mesh compatibility',
        schemaVersion: 39,
        time: {
          from: process.env.CHAOS_MESH_LIVE ? 'now-1h' : 'now-5m',
          to: 'now',
        },
        annotations: {
          list: [
            {
              name: 'Chaos Mesh events',
              enable: true,
              hide: false,
              iconColor: 'orange',
              datasource,
              target: {
                refId: 'annotation_query',
                namespace,
                kind: 'PodChaos',
                limit: 20,
              },
            },
          ],
        },
        templating: {
          list: [
            {
              name: 'chaos_namespace',
              type: 'query',
              datasource,
              query: { metric: 'namespace' },
              multi: true,
              refresh: 1,
              current: {
                text: selectedNamespaces,
                value: selectedNamespaces,
              },
            },
          ],
        },
        panels: [
          {
            id: 1,
            title: 'Chaos events',
            type: 'table',
            datasource,
            gridPos: { h: 10, w: 24, x: 0, y: 0 },
            targets: [
              { refId: 'A', namespace: '$chaos_namespace', kind: 'PodChaos' },
            ],
          },
          {
            id: 2,
            title: 'Chaos event annotations',
            type: 'timeseries',
            datasource,
            gridPos: { h: 8, w: 24, x: 0, y: 10 },
            targets: [{ refId: 'A', namespace, kind: 'PodChaos' }],
            transformations: [
              {
                id: 'groupBy',
                options: {
                  fields: {
                    Time: { operation: 'groupby', aggregations: [] },
                    Message: {
                      operation: 'aggregate',
                      aggregations: ['count'],
                    },
                  },
                },
              },
            ],
          },
        ],
      },
    },
  })
  expect(response.ok()).toBeTruthy()
})

test('configuration loads and authenticates through the Grafana proxy', async ({
  page,
}) => {
  await page.goto('/connections/datasources/edit/chaosmesh-compat')
  await expect(page.getByPlaceholder('http://localhost:2333')).toBeVisible()
  await page.getByRole('button', { name: 'Save & test' }).click()
  await expect(page.getByText('Chaos Mesh API is available')).toBeVisible()
})

test('multi-value query renders data frames in a table', async ({ page }) => {
  const eventRequest = process.env.CHAOS_MESH_LIVE
    ? undefined
    : page.waitForRequest(
        (request) =>
          new URL(request.url()).pathname.endsWith('/api/events') &&
          new URL(request.url()).searchParams.getAll('namespace').length === 2
      )
  await page.goto('/d/chaosmesh-compat/chaos-mesh-compatibility')
  await expect(
    page.getByText(experiment, { exact: true }).first()
  ).toBeVisible()
  await expect(page.getByText(namespace, { exact: true }).first()).toBeVisible()
  await expect(
    page.getByText('PodChaos', { exact: true }).first()
  ).toBeVisible()
  await expect(page.getByText('Invalid date', { exact: false })).toHaveCount(0)
  if (eventRequest) {
    expect(
      new URL((await eventRequest).url()).searchParams
        .getAll('namespace')
        .sort()
    ).toEqual([...selectedNamespaces].sort())
    await expect(
      page.getByText('experiment-b', { exact: true }).first()
    ).toBeVisible()
    await page.goto('/d/chaosmesh-compat/chaos-mesh-compatibility?editPanel=1')
    const limit = page.locator('.gf-form input[type="number"]')
    const events = page.getByRole('table').getByText(/^experiment-[ab]$/)
    await limit.fill('1')
    await expect(events).toHaveCount(1)

    await limit.fill('')
    await expect(events).toHaveCount(4)

    await limit.fill('-1')
    await expect(events).toHaveCount(4)

    await limit.fill('0')
    await expect(events).toHaveCount(0)
  }
})

test('namespace variable editor executes its query', async ({
  variableEditPage,
  page,
}) => {
  await variableEditPage.datasource.set('Chaos Mesh compatibility')
  const metric = page.locator('.gf-form').getByRole('combobox')
  await metric.fill('Namespace')
  await metric.press('Enter')
  await variableEditPage.runQuery()
  await expect(variableEditPage).toDisplayPreviews([namespace])
})

test('annotation renders event details on the time series', async ({
  page,
}) => {
  const annotationResponse = page.waitForResponse((response) => {
    const url = new URL(response.url())
    return (
      url.pathname.endsWith('/api/events') &&
      url.searchParams.get('limit') === '20'
    )
  })
  await page.goto('/d/chaosmesh-compat/chaos-mesh-compatibility')
  expect((await annotationResponse).ok()).toBeTruthy()
  await page
    .getByText('Chaos event annotations', { exact: true })
    .scrollIntoViewIfNeeded()
  const marker = page.getByTestId('data-testid annotation-marker')
  await expect(marker).toBeVisible()
  await marker.hover()
  await expect(
    page.getByText('Chaos Mesh events', { exact: true }).last()
  ).toBeVisible()
  if (!process.env.CHAOS_MESH_LIVE) {
    await expect(
      page.getByText('1: Compatibility event compat-e2e 2')
    ).toBeVisible()
    await expect(
      page.getByText('2: Compatibility event compat-e2e 1')
    ).toBeVisible()
  }
})
