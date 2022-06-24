/*
 * Copyright 2022 Chaos Mesh Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 *
 */
import { DataQuery, DataSourceJsonData } from '@grafana/data';

interface EventBase {
  object_id: uuid;
  namespace: string;
  name: string;
  kind: string;
}

export interface Event extends EventBase {
  created_at: string;
  type: 'Normal' | 'Warning';
  reason: string;
  message: string;
}

export interface EventsQuery extends DataQuery, EventBase {
  start: string;
  end: string;
  limit?: number;
}

export const defaultQuery: Partial<EventsQuery> = {
  limit: 300,
};

export const kinds = [
  'AWSChaos',
  'AzureChaos',
  'BlockChaos',
  'DNSChaos',
  'GCPChaos',
  'HTTPChaos',
  'IOChaos',
  'JVMChaos',
  'KernelChaos',
  'NetworkChaos',
  'PodChaos',
  'StressChaos',
  'TimeChaos',
  'PhysicalMachineChaos',
];

export interface VariableQuery {
  metric: 'namespace' | 'kind' | 'experiment' | 'schedule' | 'workflow';
  queryString?: string;
}

/**
 * These are options configured for each DataSource instance
 */
export interface ChaosMeshOptions extends DataSourceJsonData {
  limit?: number;
}
