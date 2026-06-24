import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  PushNotificationProvider,
  type PushNotificationPayload,
} from '../push-notification-provider.interface.js';

interface ExpoPushTicket {
  status: 'ok' | 'error';
  message?: string;
}

@Injectable()
export class ExpoPushNotificationProvider extends PushNotificationProvider {
  private readonly logger = new Logger(ExpoPushNotificationProvider.name);
  private readonly accessToken?: string;

  constructor(private readonly config: ConfigService) {
    super();
    this.accessToken = this.config.get<string>('EXPO_ACCESS_TOKEN');
  }

  async sendToTokens(
    tokens: string[],
    payload: PushNotificationPayload,
  ): Promise<void> {
    if (tokens.length === 0) return;

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    };

    if (this.accessToken) {
      headers.Authorization = `Bearer ${this.accessToken}`;
    }

    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers,
      body: JSON.stringify(
        tokens.map((token) => ({
          to: token,
          title: payload.title,
          body: payload.body,
          data: payload.data ?? {},
          richContent: payload.imageUrl ? { image: payload.imageUrl } : undefined,
        })),
      ),
    });

    if (!response.ok) {
      const body = await response.text();
      throw new Error(`Expo push failed (${response.status}): ${body}`);
    }

    const tickets = (await response.json()) as { data?: ExpoPushTicket[] };
    const errors = (tickets.data ?? []).filter((ticket) => ticket.status === 'error');

    if (errors.length > 0) {
      this.logger.warn({ errors }, 'Some Expo push tickets failed');
    }
  }
}
