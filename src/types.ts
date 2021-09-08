import { DataQuery, DataSourceJsonData } from '@grafana/data';

export interface Event {
  object_id: uuid;
  created_at: string;
  namespace: string;
  name: string;
  kind: string;
  type: 'Normal' | 'Warning';
  reason: string;
  message: string;
}

export interface EventsQuery extends DataQuery {
  object_id?: uuid;
  start: string;
  end: string;
  namespace?: string;
  name?: string;
  kind?: string;
  limit?: number;
}

export const defaultQuery: Partial<EventsQuery> = {
  limit: 216,
};

export const kinds = [
  'AWSChaos',
  'DNSChaos',
  'GCPChaos',
  'HTTPChaos',
  'IOChao',
  'JVMChaos',
  'KernelChaos',
  'NetworkChaos',
  'PodChaos',
  'StressChaos',
  'TimeChaos',
];

export interface VariableQuery {
  metric: 'namespace' | 'kind' | 'experiment' | 'schedule';
}

/**
 * These are options configured for each DataSource instance
 */
export interface ChaosMeshDataSourceOptions extends DataSourceJsonData {}

/**
 * Value that is used in the backend, but never sent over HTTP to the frontend
 */
export interface MySecureJsonData {}
