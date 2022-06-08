module.exports = {
  ...require('./node_modules/@grafana/toolkit/src/config/prettier.plugin.config.json'),
  arrowParens: 'avoid',
  importOrder: [
    '<THIRD_PARTY_MODULES>',
    '^@ui/(.*)$',
    'store',
    '^slices/(.*)$',
    '^components/(.*)$',
    '^lib/(.*)$',
    '^images/(.*)$',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
}
