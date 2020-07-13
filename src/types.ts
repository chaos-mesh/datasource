import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface ChaosEventsQuery extends DataQuery {
  namespace?: string;
  kind: string;
  experiment?: string;
  startTime: string;
  finishTime: string;
}

export const defaultQuery: Partial<ChaosEventsQuery> = {
  kind: 'PodChaos',
};

/**
 * These are options configured for each DataSource instance
 */
export interface ChaosMeshOptions extends DataSourceJsonData {
  defaultUrl: string;
}

export interface ChaosEvent {
  ID: number;
  CreatedAt: string;
  UpdatedAt: string;
  DeletedAt: string | null;
  Experiment: string;
  Namespace: string;
  Kind: string;
  Message: string;
  StartTime: string;
  FinishTime: string;
}

export interface ChaosEventsQueryResponse {
  status: number;
  data: ChaosEvent[];
}
