# Chaos Mesh Data Source

> **This plugin is deprecated, please use <https://grafana.com/grafana/plugins/chaosmeshorg-datasource/>.**

Grafana data source plugin for Chaos Mesh.

## Features

- Visualize Chaos Events on the table
- Show Chaos Events on the graph with [Annotations](https://grafana.com/docs/grafana/latest/dashboards/annotations/)
- Display different Chaos Events by [Variables](https://grafana.com/docs/grafana/latest/variables/)

## Installation

```sh
grafana-cli plugins install yeya24-chaosmesh-datasource
```

## Setup

After installed, you can add this data source in **Configuration -> Data Sources**, then you will enter the settings page:

![Settings](https://raw.githubusercontent.com/chaos-mesh/datasource/5d3d1eab6d91dc32e2a3f42cf40483d67ef07d90/src/img/settings.jpg)

Only the `URL` field needs to be filled in and the others can be ignored.

Assuming you have a local Chaos Mesh installed, the dashboard will default export its API in port `2333`. So, if you don't modify anything, you can simply fill `http://localhost:2333` into it.

Then use **port-forward** to active:

```sh
kubectl port-forward -n chaos-testing svc/chaos-dashboard 2333:2333
```

Finally, click **Save & Test** to test the connection. If it shows that the connection is successful, then the setup work has been completed.

### Options

Except for the `url`, this data source plugin has such options as below:

| Name  | Description                                                                                                           |
| ----- | --------------------------------------------------------------------------------------------------------------------- |
| Limit | Limit the number of returned Chaos Events. The default is 25. If you want to display more events, please increase it. |

## Query

Mostly, there will be three options to be responsible for filtering events:

- **Experiment** - Filter by the experiment name. Must be a full name.
- **Namespace** - Filter by different namespaces
- **Kind** - Filter by Chaos kinds

For real world usage, normally you will use these options in two situations:

- Specify all fields to locate an experiment more precisely.
- Let **Experiment** be empty to reduce the constraints of events filtering.
- Pass a variable like `$experiment` to query to control the events displaying.

## Annotations

Edit example:

![Annotations](https://raw.githubusercontent.com/chaos-mesh/datasource/5d3d1eab6d91dc32e2a3f42cf40483d67ef07d90/src/img/annotations.png)

For usage, you can refer to the content described by [Query](#query).

## Variables

If you choose the Variables type to query and select the data source to Chaos Mesh, You can get three different kind values.

Specify by choosing different **metric**:

- Experiment

  After selection, a text input field will occur, fill in the value of the experiment name you want to settle. Usually, you will fill in the **partial** name of some experiments to get the related experiment names.

  > For example, you have two experiments:
  >
  > random-pod-kill and random-pod-failure
  >
  > Then you can fill **random** in the text field to get these experiments.

- Namespace

  After selection, all available namespaces will show in **Preview of values** directly. Without other operations.

- Kind

  Same as **Namespace**.

## How to contribute

Pull a request or open an issue to describe your changes or problems.

## License

Same as Chaos Mesh. Under Apache-2.0 License.
