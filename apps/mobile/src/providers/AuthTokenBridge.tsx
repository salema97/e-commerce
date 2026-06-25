import { useEffect } from 'react';
import { setGetAuthToken } from '../lib/api.js';
import { useAuth } from './AuthProvider.js';

export function AuthTokenBridge(): null {
  const { accessToken } = useAuth();

  useEffect(() => {
    setGetAuthToken(async () => accessToken);
  }, [accessToken]);

  return null;
}
