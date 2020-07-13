# Chaos Mesh Data Source

Visualize Chaos Mesh Events with Grafana.

![screenshot](https://raw.githubusercontent.com/chaos-mesh/chaos-mesh-datasource/master/docs/assets/example.png)

## Usage

For detailed usage, please check [Tutorial](https://github.com/chaos-mesh/chaos-mesh-datasource/blob/master/docs/usage.md).

## Development

You need to install the following first:

- [yarn](https://yarnpkg.com/)
- [Docker Compose](https://docs.docker.com/compose/)

1. Install dependencies
```BASH
yarn install
```
2. Build plugin in development mode or run in watch mode
```BASH
yarn dev
```
or
```BASH
yarn watch
```
3. Build plugin in production mode
```BASH
yarn build
```

### Develop using Docker Compose

First build the data source locally

```bash
yarn dev
```

You can develop using Docker Compose easily.

```bash
docker-compose up -d
```

Then you can open `localhost:3000` at the browser and find the Chaos Mesh data source.

![find data source](https://raw.githubusercontent.com/chaos-mesh/chaos-mesh-datasource/master/docs/assets/find-data-source.png)

Remember that every time the source code changes, you need to restart the Grafana container to load the latest plugin.

## Learn more
- [Chaos Mesh Repository](https://github.com/pingcap/chaos-mesh)
- [Chaos Mesh Website](https://chaos-mesh.org/)
- [Build a data source plugin tutorial](https://grafana.com/tutorials/build-a-data-source-plugin)
