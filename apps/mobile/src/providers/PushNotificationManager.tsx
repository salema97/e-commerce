import { useCallback } from 'react';
import { useRouter, type Href } from 'expo-router';
import { usePushNotifications } from '../hooks/usePushNotifications';
import { parseDeepLink } from '../lib/deep-links';

export function PushNotificationManager(): null {
  const router = useRouter();

  const handleNotificationResponse = useCallback(
    (url: string) => {
      const target = parseDeepLink(url);
      if (target) {
        router.navigate({
          pathname: target.pathname,
          params: target.params,
        } as Href);
      }
    },
    [router],
  );

  usePushNotifications(handleNotificationResponse);
  return null;
}
