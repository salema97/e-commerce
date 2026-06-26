'use client';

import { createContext, use, useCallback, useEffect, useMemo, useState } from 'react';
import type { AuthUser } from '@repo/shared-types';

interface AuthContextValue {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  setSession: (user: AuthUser) => void;
  refresh: () => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const res = await fetch('/api/auth/me');
    if (!res.ok) {
      setUser(null);
      return;
    }
    const data = (await res.json()) as { user: AuthUser };
    setUser(data.user);
  }, []);

  useEffect(() => {
    void refresh().finally(() => setLoading(false));
  }, [refresh]);

  const setSession = useCallback((nextUser: AuthUser) => {
    setUser(nextUser);
  }, []);

  const signOut = useCallback(async () => {
    await fetch('/api/auth/logout', { method: 'POST' });
    setUser(null);
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      loading,
      setSession,
      refresh,
      signOut,
    }),
    [user, loading, setSession, refresh, signOut],
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = use(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
