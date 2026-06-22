import { createApiClient, type ApiClientOptions, type ApiClient, type ApiClientError } from './client.js';
import { createQueryHooks, queryKeys, type ApiQueryHooks } from './hooks.js';

export interface CreateApiClientResult {
  client: ApiClient;
  hooks: ApiQueryHooks;
}

export function createApi(options: ApiClientOptions): CreateApiClientResult {
  const client = createApiClient(options);
  const hooks = createQueryHooks(client);
  return { client, hooks };
}

export { createApiClient, createQueryHooks, queryKeys };
export type { ApiClientOptions, ApiClient, ApiClientError, ApiQueryHooks };
export * from '@repo/shared-types';
