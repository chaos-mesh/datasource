import { createServer } from 'node:http'

const started = Date.now()
const events = ['compat-e2e', 'canary-e2e'].flatMap((namespace, index) =>
  [0, 1].map((offset) => ({
    object_id: `00000000-0000-4000-8000-00000000000${index}`,
    namespace,
    name: `experiment-${index === 0 ? 'a' : 'b'}`,
    kind: 'PodChaos',
    created_at: new Date(started - (offset + 1) * 60_000).toISOString(),
    type: 'Normal',
    reason: offset === 0 ? 'Applied' : 'Selected',
    message: `Compatibility event ${namespace} ${offset + 1}`,
  }))
)

createServer((request, response) => {
  const url = new URL(request.url, 'http://localhost')
  const send = (status, data) => {
    response.writeHead(status, { 'Content-Type': 'application/json' })
    response.end(JSON.stringify(data))
  }

  if (url.pathname === '/health') {
    return send(200, { status: 'ok' })
  }
  if (request.headers.authorization !== 'Bearer compatibility-test-token') {
    return send(401, { error: 'Unauthorized' })
  }

  switch (url.pathname) {
    case '/api/common/config':
      return send(200, { security_mode: true, version: 'v2.8.9' })
    case '/api/common/chaos-available-namespaces':
      return send(200, ['compat-e2e', 'canary-e2e'])
    case '/api/events': {
      const filtered = events.filter((event) => {
        for (const field of ['namespace', 'name', 'kind', 'object_id']) {
          const values = url.searchParams.getAll(field).filter(Boolean)
          if (values.length > 0 && !values.includes(event[field])) {
            return false
          }
        }
        const time = Date.parse(event.created_at)
        const start = url.searchParams.get('start')
        const end = url.searchParams.get('end')
        return (
          (!start || time >= Date.parse(start)) &&
          (!end || time <= Date.parse(end))
        )
      })
      const rawLimit = url.searchParams.get('limit')
      const limit = rawLimit ? Number(rawLimit) : -1
      if (
        rawLimit &&
        (!/^[+-]?\d+$/.test(rawLimit) || !Number.isInteger(limit))
      ) {
        return send(500, { error: 'Invalid limit' })
      }

      if (url.searchParams.get('sort') === 'created_at') {
        filtered.sort(
          (a, b) => Date.parse(b.created_at) - Date.parse(a.created_at)
        )
      }

      return send(200, limit >= 0 ? filtered.slice(0, limit) : filtered)
    }
    default:
      return send(404, { error: 'Not found' })
  }
}).listen(23033, '0.0.0.0', () => {
  console.log('Chaos API fixture listening on port 23033')
})
