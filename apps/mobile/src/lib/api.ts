import { createApi } from '@repo/api-client';

let getAuthTokenRef: () => Promise<string | null> = async () => null;

export function setGetAuthToken(getToken: () => Promise<string | null>): void {
  getAuthTokenRef = getToken;
}

export const api = createApi({
  baseURL: process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3001/v1',
  getToken: () => getAuthTokenRef(),
});
