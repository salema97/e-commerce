import type { EmailTemplate } from '@repo/shared-types';

export interface PushNotificationPayload {
  title: string;
  body: string;
  data?: Record<string, string>;
}

/**
 * Port abstraction for push notification providers (Expo, OneSignal, FCM).
 */
export abstract class PushNotificationProvider {
  abstract sendToTokens(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<void>;
}
