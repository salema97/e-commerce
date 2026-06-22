import { usePushNotifications } from '../hooks/usePushNotifications.js';

export function PushNotificationManager(): null {
  usePushNotifications();
  return null;
}
