import { Injectable, Logger } from '@nestjs/common';
import {
  PushNotificationProvider,
  type PushNotificationPayload,
} from '../push-notification-provider.interface.js';

@Injectable()
export class ConsolePushNotificationProvider extends PushNotificationProvider {
  private readonly logger = new Logger(ConsolePushNotificationProvider.name);

  sendToTokens(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<void> {
    this.logger.log(
      { tokenCount: tokens.length, title: payload.title },
      'Console push provider would send notification',
    );
    return Promise.resolve();
  }
}
