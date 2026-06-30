import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

const ACCESS_KEY = 'auth_access_token';
const REFRESH_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';

export interface StoredAuthUser {
  id: string;
  email: string;
  name: string | null;
  role: string;
}

function isNative(): boolean {
  return Platform.OS === 'ios' || Platform.OS === 'android';
}

function throwOnFailure(error: unknown): never {
  // eslint-disable-next-line no-console
  console.error('[auth-storage] SecureStore failed — user must re-authenticate', error);
  throw new Error('Secure storage unavailable. Please re-authenticate.');
}

// Web/E2E fallback: in-memory only. Tokens persist only for the session lifetime
// and are never written to localStorage.
const memoryStore = new Map<string, string>();

export async function saveAuthSession(
  accessToken: string,
  refreshToken: string,
  user: StoredAuthUser,
): Promise<void> {
  if (isNative()) {
    try {
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_KEY, accessToken),
        SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
        SecureStore.setItemAsync(USER_KEY, JSON.stringify(user)),
      ]);
    } catch (error) {
      throwOnFailure(error);
    }
    return;
  }

  memoryStore.set(ACCESS_KEY, accessToken);
  memoryStore.set(REFRESH_KEY, refreshToken);
  memoryStore.set(USER_KEY, JSON.stringify(user));
}

export async function clearAuthSession(): Promise<void> {
  if (isNative()) {
    try {
      await Promise.all([
        SecureStore.deleteItemAsync(ACCESS_KEY),
        SecureStore.deleteItemAsync(REFRESH_KEY),
        SecureStore.deleteItemAsync(USER_KEY),
      ]);
    } catch (error) {
      throwOnFailure(error);
    }
    return;
  }

  memoryStore.delete(ACCESS_KEY);
  memoryStore.delete(REFRESH_KEY);
  memoryStore.delete(USER_KEY);
}

export async function getAccessToken(): Promise<string | null> {
  if (isNative()) {
    try {
      return await SecureStore.getItemAsync(ACCESS_KEY);
    } catch (error) {
      throwOnFailure(error);
    }
  }
  return memoryStore.get(ACCESS_KEY) ?? null;
}

export async function getRefreshToken(): Promise<string | null> {
  if (isNative()) {
    try {
      return await SecureStore.getItemAsync(REFRESH_KEY);
    } catch (error) {
      throwOnFailure(error);
    }
  }
  return memoryStore.get(REFRESH_KEY) ?? null;
}

export async function updateAuthTokens(
  accessToken: string,
  refreshToken: string,
): Promise<void> {
  if (isNative()) {
    try {
      await Promise.all([
        SecureStore.setItemAsync(ACCESS_KEY, accessToken),
        SecureStore.setItemAsync(REFRESH_KEY, refreshToken),
      ]);
    } catch (error) {
      throwOnFailure(error);
    }
    return;
  }

  memoryStore.set(ACCESS_KEY, accessToken);
  memoryStore.set(REFRESH_KEY, refreshToken);
}

export async function getStoredUser(): Promise<StoredAuthUser | null> {
  let raw: string | null = null;

  if (isNative()) {
    try {
      raw = await SecureStore.getItemAsync(USER_KEY);
    } catch (error) {
      throwOnFailure(error);
    }
  } else {
    raw = memoryStore.get(USER_KEY) ?? null;
  }

  if (!raw) return null;
  try {
    return JSON.parse(raw) as StoredAuthUser;
  } catch {
    return null;
  }
}
