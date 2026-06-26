import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PushNotificationProvider,
  type PushNotificationPayload,
} from '../push-notification-provider.interface.js';
import { resilientFetch } from '../../common/resilience/resilient-fetch.js';

/**
 * OneSignal REST API adapter for scale deployments.
 * MVP uses Expo; enable with PUSH_PROVIDER=onesignal.
 */
@Injectable()
export class OneSignalPushNotificationProvider extends PushNotificationProvider {
  private readonly logger = new Logger(OneSignalPushNotificationProvider.name);

  constructor(private readonly config: ConfigService) {
    super();
  }

  async sendToTokens(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<void> {
    const appId = this.config.get<string>('ONESIGNAL_APP_ID');
    const apiKey = this.config.get<string>('ONESIGNAL_API_KEY');
    if (!appId || !apiKey) {
      throw new Error('ONESIGNAL_APP_ID and ONESIGNAL_API_KEY are required');
    }

    const response = await resilientFetch('push.onesignal', 'https://api.onesignal.com/notifications', {
      method: 'POST',
      headers: {
        Authorization: `Key ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        app_id: appId,
        include_player_ids: tokens,
        headings: { en: payload.title },
        contents: { en: payload.body },
        data: payload.data ?? {},
        big_picture: payload.imageUrl,
        url: payload.data?.url,
      }),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`OneSignal push failed (${response.status}): ${body}`);
    }

    this.logger.debug({ tokenCount: tokens.length }, 'OneSignal push sent');
  }
}
