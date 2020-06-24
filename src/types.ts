import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface ChaosEventsQuery extends DataQuery {
  namespace?: string;
  kind: string;
  experiment?: string;
  // startTime: string;
  // endTime: string;
}

export const defaultQuery: Partial<ChaosEventsQuery> = {
  kind: 'PodChaos',
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {}

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
  Pods: Array<{
    ID: string;
    CreateAt: string;
    UpdateAt: string;
    DeleteAt: string | null;
    EventID: number;
    PodIP: string;
    PodName: string;
    Namespace: string;
    Message: string;
    Action: string;
  }>;
}

export interface ChaosEventsQueryResponse {
  status: number;
  data: ChaosEvent[];
}
