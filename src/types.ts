import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface EventsQuery extends DataQuery {
  namespace?: string;
  kind: string;
  experiment?: string;
  // startTime: string;
  // endTime: string;
}

export const defaultQuery: Partial<EventsQuery> = {
  kind: 'PodChaos',
};

/**
 * These are options configured for each DataSource instance
 */
export interface MyDataSourceOptions extends DataSourceJsonData {}
