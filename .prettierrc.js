module.exports = {
  // Prettier configuration provided by Grafana scaffolding
  ...require('./.config/.prettierrc.js'),
  printWidth: 80,
  importOrder: [
    '<THIRD_PARTY_MODULES>',
    '^[./]',
  ],
  importOrderSeparation: true,
  importOrderSortSpecifiers: true,
  "plugins": ["@trivago/prettier-plugin-sort-imports"]
};
