import { useEffect } from 'react';
import { setAuthRefreshCallbacks, setGetAuthToken } from '../lib/api';
import { useAuth } from './AuthProvider';

export function AuthTokenBridge(): null {
  const { accessToken, syncAccessToken, clearLocalSession } = useAuth();

  useEffect(() => {
    setGetAuthToken(async () => accessToken);
  }, [accessToken]);

  useEffect(() => {
    setAuthRefreshCallbacks({
      onTokenRefreshed: syncAccessToken,
      onSessionExpired: () => {
        void clearLocalSession();
      },
    });
  }, [syncAccessToken, clearLocalSession]);

  return null;
}
