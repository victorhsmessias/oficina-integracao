import { appConfig, type AppConfig } from './config';
import { createHttpApi } from './httpApi';
import { mockApi } from './mockApi';
import type { ApiClient } from './types';

export { ApiError } from './types';
export type { ApiClient, AuthSession, User } from './types';
export { mockApi } from './mockApi';
export { createHttpApi } from './httpApi';

export function createApiClient(config: AppConfig): ApiClient {
  return config.useMockApi ? mockApi : createHttpApi(config.apiUrl);
}

export const apiClient: ApiClient = createApiClient(appConfig);
