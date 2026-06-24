'use client';

import * as React from 'react';
import type { AuthUser } from '@repo/shared-types';

interface AuthContextValue {
  user: AuthUser | null;
  accessToken: string | null;
  loading: boolean;
  setSession: (user: AuthUser, accessToken: string) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [accessToken, setAccessToken] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      setUser(null);
      setAccessToken(null);
      return;
    }
    const data = (await res.json()) as { user: AuthUser; accessToken: string };
    setUser(data.user);
    setAccessToken(data.accessToken);
  }, []);

  React.useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const setSession = React.useCallback((nextUser: AuthUser, token: string) => {
    setUser(nextUser);
    setAccessToken(token);
  }, []);

  const signOut = React.useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
    setAccessToken(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, accessToken, loading, setSession, refresh, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
