import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface ChaosEventsQuery extends DataQuery {
  namespace?: string;
  kind: string;
  experiment?: string;
  startTime: string;
  finishTime: string;
  limit: number;
}

export const defaultQuery: Partial<ChaosEventsQuery> = {
  kind: 'PodChaos',
};

/**
 * These are options configured for each DataSource instance
 */
export interface ChaosMeshOptions extends DataSourceJsonData {
  defaultUrl: string;
  limit: number;
}

export interface ChaosEvent {
  id: number;
  experiment_id: string;
  experiment: string;
  namespace: string;
  kind: string;
  message: string;
  start_time: string;
  finish_time: string;
}

export interface ChaosEventsQueryResponse {
  status: number;
  data: ChaosEvent[];
}
