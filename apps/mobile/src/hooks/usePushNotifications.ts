import { useState, useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import {
  registerForPushNotificationsAsync,
  addNotificationReceivedListener,
  addNotificationResponseReceivedListener,
  removeNotificationSubscription,
} from '../lib/notifications.js';

export interface UsePushNotificationsResult {
  pushToken: string | null;
  notification: Notifications.Notification | null;
  error: string | null;
}

export function usePushNotifications(): UsePushNotificationsResult {
  const [pushToken, setPushToken] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notifications.Notification | null>(null);
  const [error, setError] = useState<string | null>(null);
  const isRegisteredRef = useRef(false);

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
    });

    return () => {
      removeNotificationSubscription(receivedSubscription);
      removeNotificationSubscription(responseSubscription);
    };
  }, []);

  return { pushToken, notification, error };
}
