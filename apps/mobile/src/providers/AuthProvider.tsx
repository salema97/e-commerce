import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { AuthResponse } from '@repo/shared-types';
import {
  clearAuthSession,
  getAccessToken,
  getRefreshToken,
  getStoredUser,
  saveAuthSession,
  type StoredAuthUser,
} from '../lib/auth-storage';
import { getApiBaseUrl } from '../lib/env';

interface AuthContextValue {
  user: StoredAuthUser | null;
  accessToken: string | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, name?: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<StoredAuthUser | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      const [token, storedUser] = await Promise.all([getAccessToken(), getStoredUser()]);
      setAccessToken(token);
      setUser(storedUser);
      setLoading(false);
    })();
  }, []);

  const applySession = useCallback(async (data: AuthResponse) => {
    await saveAuthSession(data.tokens.accessToken, data.tokens.refreshToken, data.user);
    setAccessToken(data.tokens.accessToken);
    setUser(data.user);
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const res = await fetch(`${getApiBaseUrl()}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!res.ok) throw new Error('Credenciales inválidas');
    await applySession((await res.json()) as AuthResponse);
  }, [applySession]);

  const signUp = useCallback(async (email: string, password: string, name?: string) => {
    const res = await fetch(`${getApiBaseUrl()}/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
    });
    if (!res.ok) throw new Error('No se pudo registrar');
    await applySession((await res.json()) as AuthResponse);
  }, [applySession]);

  const signOut = useCallback(async () => {
    const refresh = await getRefreshToken();
    if (refresh) {
      await fetch(`${getApiBaseUrl()}/auth/logout`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refresh }),
      }).catch(() => undefined);
    }
    await clearAuthSession();
    setUser(null);
    setAccessToken(null);
  }, []);

  const value = useMemo(
    () => ({ user, accessToken, loading, signIn, signUp, signOut }),
    [user, accessToken, loading, signIn, signUp, signOut],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
