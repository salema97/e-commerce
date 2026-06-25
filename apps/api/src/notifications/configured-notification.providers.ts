import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketingEmailProvider } from './marketing-email-provider.interface.js';
import { ConsoleMarketingEmailProvider } from './providers/console-marketing-email.provider.js';
import { LoopsMarketingEmailProvider } from './providers/loops-marketing-email.provider.js';
import { PushNotificationProvider, type PushNotificationPayload } from './push-notification-provider.interface.js';
import { ConsolePushNotificationProvider } from './providers/console-push.provider.js';
import { ExpoPushNotificationProvider } from './providers/expo-push.provider.js';
import { OneSignalPushNotificationProvider } from './providers/onesignal-push.provider.js';

@Injectable()
export class ConfiguredPushNotificationProvider extends PushNotificationProvider {
  private readonly delegate: PushNotificationProvider;

  constructor(
    config: ConfigService,
    consoleProvider: ConsolePushNotificationProvider,
    expoProvider: ExpoPushNotificationProvider,
    oneSignalProvider: OneSignalPushNotificationProvider,
  ) {
    super();
    const selected = config.get<string>('PUSH_PROVIDER', 'console');
    if (selected === 'expo') {
      this.delegate = expoProvider;
    } else if (selected === 'onesignal') {
      this.delegate = oneSignalProvider;
    } else {
      this.delegate = consoleProvider;
    }
  }

  sendToTokens(tokens: string[], payload: PushNotificationPayload): Promise<void> {
    return this.delegate.sendToTokens(tokens, payload);
  }
}

@Injectable()
export class ConfiguredMarketingEmailProvider extends MarketingEmailProvider {
  private readonly delegate: MarketingEmailProvider;

  constructor(
    config: ConfigService,
    consoleProvider: ConsoleMarketingEmailProvider,
    loopsProvider: LoopsMarketingEmailProvider,
  ) {
    super();
    const selected = config.get<string>('MARKETING_EMAIL_PROVIDER', 'console');
    this.delegate = selected === 'loops' ? loopsProvider : consoleProvider;
  }

  trackEvent(
    email: string,
    event: Parameters<MarketingEmailProvider['trackEvent']>[1],
    properties?: Parameters<MarketingEmailProvider['trackEvent']>[2],
  ): Promise<void> {
    return this.delegate.trackEvent(email, event, properties);
  }

  syncContact(
    email: string,
    profile: Parameters<MarketingEmailProvider['syncContact']>[1],
  ): Promise<void> {
    return this.delegate.syncContact(email, profile);
  }
}
