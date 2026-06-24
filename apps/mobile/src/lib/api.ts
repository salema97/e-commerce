import { createApi } from '@repo/api-client';
import { getApiBaseUrl } from './env.js';

let getAuthTokenRef: () => Promise<string | null> = async () => null;

export function setGetAuthToken(getToken: () => Promise<string | null>): void {
  getAuthTokenRef = getToken;
}

export const api = createApi({
  baseURL: getApiBaseUrl(),
  getToken: () => getAuthTokenRef(),
});
