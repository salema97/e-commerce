import { useCallback } from 'react';
import { useRouter } from 'expo-router';
import { navigateDeepLink } from '../lib/deep-links';
import { usePushNotifications } from '../hooks/usePushNotifications';

export function PushNotificationManager(): null {
  const router = useRouter();

  const handleNotificationResponse = useCallback(
    (url: string) => navigateDeepLink(router, url),
    [router],
  );

  usePushNotifications(handleNotificationResponse);
  return null;
}
