import { useState, useEffect, useRef } from 'react';
import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  removeNotificationSubscription,
} from '../lib/notifications.js';
import { api } from '../lib/api.js';
import { useAuth } from '../providers/AuthProvider.js';
import { setRegisteredPushToken } from '../lib/push-token-registry.js';

export interface UsePushNotificationsResult {
  pushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
}

export function usePushNotifications(
  onNotificationResponse?: (url: string) => void,
): UsePushNotificationsResult {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isRegisteredRef = useRef(false);
  const syncedTokenRef = useRef<string | null>(null);
  const { user } = useAuth();

  useEffect(() => {
    if (isRegisteredRef.current) {
      return;
    }
    isRegisteredRef.current = true;

    registerForPushNotificationsAsync().then((result) => {
      if (result.error) {
        setError(result.error);
      } else {
        setPushToken(result.token ?? null);
      }
    });

    const receivedSubscription = addNotificationReceivedListener((incoming) => {
      setNotification(incoming);
    });

    const responseSubscription = addNotificationResponseReceivedListener((response) => {
      setNotification(response.notification);
      const url = response.notification.request.content.data?.url;
      if (typeof url === 'string' && onNotificationResponse) {
        onNotificationResponse(url);
      }
    });

    return () => {
      removeNotificationSubscription(receivedSubscription);
      removeNotificationSubscription(responseSubscription);
    };
  }, [onNotificationResponse]);

  useEffect(() => {
    if (!user || !pushToken || syncedTokenRef.current === pushToken) {
      return;
    }

    const platform =
      Platform.OS === 'ios' ? 'ios' : Platform.OS === 'android' ? 'android' : 'web';

    void api.client.notifications.pushTokens
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
