import { useEffect } from 'react';
import { setGetAuthToken } from '../lib/api';
import { useAuth } from './AuthProvider';

export function AuthTokenBridge(): null {
  const { accessToken } = useAuth();

  useEffect(() => {
    setGetAuthToken(async () => accessToken);
  }, [accessToken]);

  return null;
}
