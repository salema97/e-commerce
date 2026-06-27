import Constants, { ExecutionEnvironment } from 'expo-constants';

export const pushNotificationsAvailable =
  Constants.executionEnvironment !== ExecutionEnvironment.StoreClient;

export interface PushRegistrationResult {
  token: string | null;
  error?: string;
}

type NotificationsModule = typeof import('expo-notifications');

async function loadNotifications(): Promise<NotificationsModule | null> {
  if (!pushNotificationsAvailable) {
    return null;
  }

  const Notifications = await import('expo-notifications');
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldShowBanner: true,
      shouldShowList: true,
      shouldPlaySound: true,
      shouldSetBadge: true,
    }),
  });
  return Notifications;
}

export async function registerForPushNotificationsAsync(): Promise<PushRegistrationResult> {
  if (!pushNotificationsAvailable) {
    return { token: null, error: 'Push notifications require a development build (not Expo Go)' };
  }

  try {
    const Notifications = await loadNotifications();
    if (!Notifications) {
      return { token: null };
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== 'granted') {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== 'granted') {
      return { token: null, error: 'Push notification permission not granted' };
    }

    const projectId = Constants.expoConfig?.extra?.eas?.projectId as string | undefined;
    const tokenData = await Notifications.getExpoPushTokenAsync({
      projectId,
    });

    return { token: tokenData.data };
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown push registration error';
    return { token: null, error: message };
  }
}

export async function addNotificationReceivedListener(
  callback: (notification: import('expo-notifications').Notification) => void,
): Promise<{ remove: () => void }> {
  const Notifications = await loadNotifications();
  if (!Notifications) {
    return { remove: () => undefined };
  }
  return Notifications.addNotificationReceivedListener(callback);
}

export async function addNotificationResponseReceivedListener(
  callback: (response: import('expo-notifications').NotificationResponse) => void,
): Promise<{ remove: () => void }> {
  const Notifications = await loadNotifications();
  if (!Notifications) {
    return { remove: () => undefined };
  }
  return Notifications.addNotificationResponseReceivedListener(callback);
}
