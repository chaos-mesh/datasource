import type { PluginOptions } from '@grafana/plugin-e2e'
import { defineConfig } from '@playwright/test'

import baseConfig from './.config/playwright.config'

export default defineConfig<PluginOptions>(baseConfig, {
  testDir: './e2e',
  fullyParallel: false,
  use: {
    baseURL: process.env.GRAFANA_URL || 'http://localhost:3002',
    timezoneId: 'UTC',
  },
  webServer: process.env.CHAOS_MESH_LIVE
    ? undefined
    : {
        command: 'node e2e/chaos-api.mjs',
        url: 'http://127.0.0.1:23033/health',
        reuseExistingServer: !process.env.CI,
      },
})
