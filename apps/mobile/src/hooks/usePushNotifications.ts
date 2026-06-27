import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import type { Notification } from 'expo-notifications';
import {
  pushNotificationsAvailable,
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
} from '../lib/notifications';
import { createMobileApiClient } from '../lib/api';
import { useAuth } from '../providers/AuthProvider';
import { setRegisteredPushToken } from '../lib/push-token-registry';

export interface UsePushNotificationsResult {
  pushToken: string | null;
  notification: Notification | null;
  error: string | null;
}

export function usePushNotifications(
  onNotificationResponse?: (url: string) => void,
): UsePushNotificationsResult {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isRegisteredRef = useRef(false);
  const syncedTokenRef = useRef<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (!pushNotificationsAvailable || isRegisteredRef.current) {
      return;
    }
    isRegisteredRef.current = true;

    let receivedSubscription: { remove: () => void } | null = null;
    let responseSubscription: { remove: () => void } | null = null;
    let cancelled = false;

    void registerForPushNotificationsAsync().then((result) => {
      if (cancelled) return;
      if (result.error) {
        setError(result.error);
      } else {
        setPushToken(result.token ?? null);
      }
    });

    void addNotificationReceivedListener((incoming) => {
      setNotification(incoming);
    }).then((subscription) => {
      if (cancelled) {
        subscription.remove();
        return;
      }
      receivedSubscription = subscription;
    });

    void addNotificationResponseReceivedListener((response) => {
      setNotification(response.notification);
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string' && onNotificationResponse) {
        onNotificationResponse(url);
      }
    }).then((subscription) => {
      if (cancelled) {
        subscription.remove();
        return;
      }
      responseSubscription = subscription;
    });

    return () => {
      cancelled = true;
      if (receivedSubscription) {
        receivedSubscription.remove();
      }
      if (responseSubscription) {
        responseSubscription.remove();
      }
    };
  }, [onNotificationResponse]);

  useEffect(() => {
    if (!user || !pushToken || syncedTokenRef.current === pushToken) {
      return;
    }

    const platform =
      Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

    void createMobileApiClient().notifications.pushTokens
      .register({ token: pushToken, platform })
      .then(() => {
        syncedTokenRef.current = pushToken;
        setRegisteredPushToken(pushToken);
      })
      .catch((syncError: unknown) => {
        const message =
          syncError instanceof Error ? syncError.message : 'Failed to sync push token';
        setError(message);
      });
  }, [user, pushToken]);

  return { pushToken, notification, error };
}
