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
        time: { from: 'now-1h', to: 'now' },
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
  await page.goto('/d/chaosmesh-compat/chaos-mesh-compatibility')
  await expect(
    page.getByText(experiment, { exact: true }).first()
  ).toBeVisible()
  await expect(page.getByText(namespace, { exact: true }).first()).toBeVisible()
  await expect(
    page.getByText('PodChaos', { exact: true }).first()
  ).toBeVisible()
  await expect(page.getByText('Invalid date', { exact: false })).toHaveCount(0)
  if (!process.env.CHAOS_MESH_LIVE) {
    await expect(
      page.getByText('experiment-b', { exact: true }).first()
    ).toBeVisible()
    await page.goto('/d/chaosmesh-compat/chaos-mesh-compatibility?editPanel=1')
    const limit = page.locator('.gf-form input[type="number"]')
    const events = page.getByText(/^experiment-[ab]$/)
    await limit.fill('1')
    await expect(events).toHaveCount(1)

    const clearedRequest = page.waitForRequest((request) =>
      request.url().includes('/api/events?')
    )
    await limit.fill('')
    expect(
      new URL((await clearedRequest).url()).searchParams.has('limit')
    ).toBe(false)
    await expect(events).toHaveCount(4)

    await limit.fill('0')
    await expect(page.getByText('No data', { exact: true })).toBeVisible()
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

test('annotation query renders the expected start and end times', async ({
  annotationEditPage,
  page,
  request,
  selectors,
}) => {
  await annotationEditPage.datasource.set('Chaos Mesh compatibility')
  await page
    .getByText('Namespace', { exact: true })
    .locator('..')
    .getByRole('textbox')
    .fill(namespace)
  await annotationEditPage
    .getByGrafanaSelector(selectors.components.Annotations.editor.testButton)
    .click()
  await expect(annotationEditPage).toHaveAlert('success')
  const response = await request.get(
    `/api/datasources/proxy/uid/chaosmesh-compat/api/events?namespace=${namespace}`
  )
  expect(response.ok()).toBeTruthy()
  const events: Array<{ created_at: string }> = await response.json()
  expect(events.length).toBeGreaterThan(0)
  const times = events.map((event) => Date.parse(event.created_at))
  for (const [field, time] of [
    ['time', Math.min(...times)],
    ['timeEnd', Math.max(...times)],
  ] as const) {
    const expected = new Date(time).toISOString().slice(0, 19).replace('T', ' ')
    const row = page.getByRole('row').filter({
      has: page.getByRole('cell', { name: field, exact: true }),
    })
    await expect(row.getByRole('cell').last()).toHaveText(expected)
  }
})
