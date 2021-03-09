import {
  AnnotationEvent,
  DataQueryRequest,
  DataQueryResponse,
  DataSourceApi,
  DataSourceInstanceSettings,
  FieldType,
  MutableDataFrame,
  ScopedVars,
} from '@grafana/data';
import { BackendSrvRequest, getBackendSrv, getTemplateSrv } from '@grafana/runtime';
import {
  ChaosEvent,
  ChaosMeshOptions,
  ChaosMeshQuery,
  ChaosMeshVariableQuery,
  ExperimentKind,
  defaultQuery,
  kindOptions,
} from './types';

import defaults from 'lodash/defaults';

export class DataSource extends DataSourceApi<ChaosMeshQuery, ChaosMeshOptions> {
  url: string;
  limit = 25;

  constructor(instanceSettings: DataSourceInstanceSettings<ChaosMeshOptions>) {
    super(instanceSettings);

    this.url = instanceSettings.url!;
    if (instanceSettings.jsonData.limit) {
      this.limit = instanceSettings.jsonData.limit;
    }
  }

  private _fetch<T = any>(path: string, options: Omit<BackendSrvRequest, 'url'> = {}) {
    return getBackendSrv()
      .fetch<T>({
        url: this.url + '/api' + path,
        ...options,
      })
      .toPromise();
  }

  fetchConfig = () => this._fetch('/common/config');

  fetchAvailableNamespaces = () => this._fetch<string[]>('/common/chaos-available-namespaces');

  fetchDryEvents = (params?: Partial<ChaosMeshQuery>) =>
    this._fetch<ChaosEvent[]>('/events/dry', {
      params,
    });

  private getVariables() {
    return getTemplateSrv()
      .getVariables()
      .map((d: any) => ({ [d.name]: d.current.value }))
      .reduce((acc, d) => ({ ...acc, ...d }), {});
  }

  private applyVariables(query: ChaosMeshQuery, scopedVars: ScopedVars) {
    const vars = getTemplateSrv()
      .replace(`${query.experimentName} ${query.namespace} ${query.kind}`, scopedVars)
      .split(' ');

    query.experimentName = vars[0];
    query.namespace = vars[1];
    query.kind = vars[2] as ExperimentKind;

    return query;
  }

  interpolateVariablesInQueries(queries: ChaosMeshQuery[], scopedVars: ScopedVars) {
    return queries.map(query => this.applyVariables(query, scopedVars));
  }

  async query(options: DataQueryRequest<ChaosMeshQuery>): Promise<DataQueryResponse> {
    const { range, scopedVars } = options;
    const from = range.from.toISOString();
    const to = range.to.toISOString();

    const data = await Promise.all(
      options.targets.map(async target => {
        const query = this.applyVariables(defaults(target, defaultQuery), scopedVars);

        const frame = new MutableDataFrame({
          refId: query.refId,
          fields: [
            { name: 'Experiment', type: FieldType.string },
            { name: 'Namespace', type: FieldType.string },
            { name: 'Kind', type: FieldType.string },
            { name: 'Start Time', type: FieldType.time },
            { name: 'Finish Time', type: FieldType.time },
            { name: 'Message', type: FieldType.string },
          ],
        });

        const data = (
          await this.fetchDryEvents({
            ...this.constructPivotalParams(query),
            startTime: from,
            finishTime: to,
            limit: this.limit,
          })
        ).data;

        data.forEach(d =>
          frame.add({
            Experiment: d.experiment,
            Namespace: d.namespace,
            Kind: d.kind,
            'Start Time': d.start_time,
            'Finish Time': d.finish_time,
            Message: d.message,
          })
        );

        return frame;
      })
    );

    return { data };
  }

  async annotationQuery(options: any): Promise<AnnotationEvent[]> {
    const { range, dashboard } = options;
    const from = range.from.toISOString();
    const to = range.to.toISOString();
    const timezone = dashboard.timezone === '' ? undefined : dashboard.timezone;

    const query = defaults(options.annotation, defaultQuery);

    const pParams: any = this.constructPivotalParams(query);
    const vals = this.getVariables();

    Object.entries(pParams).forEach((d: any) => {
      const val = d[1];
      const firstChar = val.charAt(0);
      const rest = val.substring(1);

      if (firstChar === '$' && vals[rest]) {
        pParams[d[0]] = vals[rest];
      }
    });

    const data = (
      await this.fetchDryEvents({
        ...pParams,
        startTime: from,
        finishTime: to,
        limit: this.limit,
      })
    ).data;

    return data.map((d: ChaosEvent) => ({
      title: `Experiment: ${d.experiment}`,
      text: `
          <span>Status: ${d.finish_time ? 'Finished' : 'Running'}</span>
          <span>Started: ${new Date(d.start_time).toLocaleString('en-US', { timeZone: timezone })}</span>
          ${
            d.finish_time
              ? `<span>Ended: ${new Date(d.finish_time).toLocaleString('en-US', {
                  timeZone: timezone,
                })}</span>`
              : ''
          }
        `,
      tags: [`namespace:${d.namespace}`, `kind:${d.kind}`],
      time: Date.parse(d.start_time),
      timeEnd: Date.parse(d.finish_time),
      isRegion: true,
    }));
  }

  async metricFindQuery(query: ChaosMeshVariableQuery) {
    const { metric, experimentName } = query;

    if (metric === 'experiment' && experimentName) {
      return (
        await this.fetchDryEvents({
          limit: this.limit,
        } as ChaosMeshQuery)
      ).data
        .filter(d => d.experiment.includes(experimentName))
        .map(d => ({ text: d.experiment }));
    }

    if (metric === 'namespace') {
      return (await this.fetchAvailableNamespaces()).data.map(d => ({ text: d }));
    }

    if (metric === 'kind') {
      return kindOptions.map(d => ({ text: d.value as string }));
    }

    return [];
  }

  async testDatasource() {
    try {
      await this.fetchConfig();

      return {
        status: 'success',
        message: 'Success',
      };
    } catch (error) {
      return {
        status: 'error',
        message: error,
      };
    }
  }

  private constructPivotalParams(query: Partial<ChaosMeshQuery>) {
    const result: typeof query = {};
    const { experimentName, namespace, kind } = query;

    if (experimentName) {
      result.experimentName = experimentName;
    }

    if (namespace) {
      result.namespace = namespace;
    }

    if (kind) {
      result.kind = kind;
    }

    return result;
  }
}
