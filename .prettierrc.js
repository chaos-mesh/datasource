module.exports = {
  // Prettier configuration provided by Grafana scaffolding
  ...require('./.config/.prettierrc.js'),
  semi: false,
  printWidth: 80,
  importOrder: ['<THIRD_PARTY_MODULES>', '^[./]'],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  plugins: ['@trivago/prettier-plugin-sort-imports'],
}
