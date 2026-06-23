import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { usePushNotifications } from '../hooks/usePushNotifications.js';
import { parseDeepLink } from '../lib/deep-links.js';

export function PushNotificationManager(): null {
  const router = useRouter();

  const handleNotificationResponse = useCallback(
    (url: string) => {
      const target = parseDeepLink(url);
      if (target) {
        router.navigate({ pathname: target.pathname, params: target.params });
      }
    },
    [router],
  );

  usePushNotifications(handleNotificationResponse);
  return null;
}
