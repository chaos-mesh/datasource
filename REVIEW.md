# Review Guide

This doc is mainly for reviewers.

For testing, a Chaos Mesh instance is required. In next section, we will show how to deploy a Chaos Mesh instance with Helm.

## Deploy Chaos Mesh

> Refer to <https://chaos-mesh.org/docs/production-installation-using-helm/> for more details.

Follow the steps below to deploy a minimal Chaos Mesh instance:

```bash
# Add the chart
helm repo add chaos-mesh https://charts.chaos-mesh.org
# Create a Chaos Mesh instance
# Refer to https://chaos-mesh.org/docs/production-installation-using-helm/#step-4-install-chaos-mesh-in-different-environments if you use containerd or other container runtimes.
helm install chaos-mesh chaos-mesh/chaos-mesh -n=chaos-mesh --create-namespace --set controllerManager.leaderElection.enabled=false,dashboard.securityMode=false
```

Verify the installation:

```bash
kubectl get pods -n chaos-mesh
```

Port-forward the dashboard:

```bash
kubectl port-forward svc/chaos-dashboard -n chaos-mesh 2333:2333
```

Then you can visit the dashboard at <http://localhost:2333>.

## Test data source

For data source testing, there must be some Chaos events are already created. You can finish this step by creating a Chaos experiment in the dashboard.

Navigate to `Experiments` at the left sidebar and click `New experiment` button. For example,
let's create a `Pod Failure` experiment. Select `Kubernetes` -> `Pod Fault` -> `Pod Failure`, then
choose `Namespace Selectors` in `Scope` to `default` (this means the experiment will be applied to
all pods in the `default` namespace). Finally, fill in a name like `pod-failure` and set `Duration` to `1m`,
and click `Submit` button to create the experiment.

Now you can test the data source. Start creating a query from here: <https://github.com/chaos-mesh/datasource?tab=readme-ov-file#query>.
At the same time, you can also view created Chaos events via <http://localhost:2333/#/events>.
