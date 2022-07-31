# Data Source

Grafana data source plugin for Chaos Mesh.

> Require: Chaos Mesh >= **2.1.0**, Grafana >= **7.0.0**

## Features

- Visualize Chaos Events on the table
- Show Chaos Events on the graph with [Annotations](https://grafana.com/docs/grafana/latest/dashboards/annotations/)
- Display different Chaos Events by [Variables](https://grafana.com/docs/grafana/latest/variables/)

## Install

```sh
grafana-cli plugins install chaosmeshorg-datasource
```

## Manual installation

Download the plugin zip package with the following command or go to <https://github.com/chaos-mesh/datasource/releases> to download:

```shell
curl -LO https://github.com/chaos-mesh/datasource/releases/download/v2.2.1/chaosmeshorg-datasource-2.2.1.zip
```

After downloading, unzip:

```shell
unzip chaosmeshorg-datasource-2.2.1.zip -d YOUR_PLUGIN_DIR
```

Then update and save the `grafana.ini` file:

```ini
[plugins]
  allow_loading_unsigned_plugins = chaosmeshorg-datasource
```

Finally, restart Grafana to load the plugin.

## Setup

Once installed, go to **Configuration -> Data sources** and add Chaos Mesh, then go to the configuration page:

![Settings](https://raw.githubusercontent.com/chaos-mesh/datasource/master/src/img/settings.png)

Assuming you have Chaos Mesh installed locally, Dashboard will export the API on port `2333` by default. So, if you haven't changed anything, you can just fill in `http://localhost:2333`.

Then use the `port-forward` command to activate:

```shell
kubectl port-forward -n chaos-testing svc/chaos-dashboard 2333:2333
```

Finally, click **Save & Test** to test the connection. If it shows a successful notification, the setup is complete.

## Query

The Data Source plugin looks at the Chaos Mesh through the lens of events, and the following options are responsible for filtering the different events:

- **Object ID**

  > Filter by object uuid.

- **Namespace**

  > Filter by different namespace.

- **Name**

  > Filter by object name.

- **Kind**

  > Filter by kind (PodChaos, Schedule...).

- **Limit**

  > Limit the number of events.

They will be passed as parameters to the `/api/events` API.

## Annotations

You can integrate Chaos Mesh's events into the panel via Annotations, the following is a sample creation:

![Annotations](https://raw.githubusercontent.com/chaos-mesh/datasource/master/src/img/annotations.png)

Please refer to the contents of [Query](#query) to fill in the corresponding fields.

## Variables

If you choose the type to `Query` and select the data source to `Chaos Mesh`, you can retrieve
the variables by different metrics:

![Variables](https://raw.githubusercontent.com/chaos-mesh/datasource/master/src/img/variables.png)

- Namespace

  > After selection, all available namespaces will show in **Preview of values** directly. Without other operations.

- Kind

  > Same as **Namespace**. Retrieve all kinds.

- Experiment

  > Same as **Namespace**. Retrieve current all experiments.

- Schedule

  > Same as **Namespace**. Retrieve current all schedules.

- Workflow

  > Same as **Namespace**. Retrieve current all workflows.

## How to contribute

Pull a request or open an issue to describe your changes or problems.

## License

Same as Chaos Mesh. Under Apache-2.0 License.
