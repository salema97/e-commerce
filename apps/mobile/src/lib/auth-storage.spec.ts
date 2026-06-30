import { describe, it, expect, beforeEach, vi } from 'vitest';

const store = vi.hoisted(() => ({
  os: 'ios' as 'ios' | 'android' | 'web',
  setItemAsync: vi.fn(),
  getItemAsync: vi.fn(),
  deleteItemAsync: vi.fn(),
}));

vi.mock('expo-secure-store', () => ({
  setItemAsync: store.setItemAsync,
  getItemAsync: store.getItemAsync,
  deleteItemAsync: store.deleteItemAsync,
}));

vi.mock('react-native', () => ({
  Platform: {
    get OS() {
      return store.os;
    },
  },
}));

import {
  saveAuthSession,
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  updateAuthTokens,
  getStoredUser,
} from './auth-storage.js';

describe('auth-storage', () => {
  const user = { id: 'u1', email: 'test@example.com', name: 'Test', role: 'CUSTOMER' };

  beforeEach(() => {
    vi.clearAllMocks();
    store.os = 'ios';
  });

  it('persists tokens and user via SecureStore on native platforms', async () => {
    await saveAuthSession('access', 'refresh', user);

    expect(store.setItemAsync).toHaveBeenCalledWith('auth_access_token', 'access');
    expect(store.setItemAsync).toHaveBeenCalledWith('auth_refresh_token', 'refresh');
    expect(store.setItemAsync).toHaveBeenCalledWith(
      'auth_user',
      JSON.stringify(user),
    );
  });

  it('throws when SecureStore fails on native platforms', async () => {
    store.setItemAsync.mockRejectedValueOnce(new Error('Keychain locked'));

    await expect(saveAuthSession('a', 'r', user)).rejects.toThrow(
      'Secure storage unavailable. Please re-authenticate.',
    );
  });

  it('uses in-memory storage on web and clears on session end', async () => {
    store.os = 'web';

    await saveAuthSession('web-access', 'web-refresh', user);
    expect(await getAccessToken()).toBe('web-access');
    expect(await getRefreshToken()).toBe('web-refresh');
    expect(await getStoredUser()).toEqual(user);

    await clearAuthSession();
    expect(await getAccessToken()).toBeNull();
    expect(await getRefreshToken()).toBeNull();
    expect(await getStoredUser()).toBeNull();
  });

  it('updates tokens in memory on web', async () => {
    store.os = 'web';

    await updateAuthTokens('new-access', 'new-refresh');
    expect(await getAccessToken()).toBe('new-access');
    expect(await getRefreshToken()).toBe('new-refresh');
  });
});
