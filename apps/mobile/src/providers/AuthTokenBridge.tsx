import { useEffect } from 'react';
import { useAuth } from '@clerk/clerk-expo';
import { setGetAuthToken } from '../lib/api.js';

export function AuthTokenBridge(): null {
  const { getToken } = useAuth();

  useEffect(() => {
    setGetAuthToken(() => getToken());
  }, [getToken]);

  return null;
}
