import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersModule } from '../users/users.module.js';
import { RedisModule } from '../common/redis/redis.module.js';
import { EmailModule } from './email.module.js';
import { EmailNotificationService } from './email-notification.service.js';
import { CampaignEmailService } from './campaign-email.service.js';
import { BackInStockAlertsService } from './back-in-stock-alerts.service.js';
import { AbandonedCartService } from './abandoned-cart.service.js';
import { PushNotificationService } from './push-notification.service.js';
import { PushTokensService } from './push-tokens.service.js';
import { PushTokensController } from './push-tokens.controller.js';
import { NotificationPreferencesController } from './notification-preferences.controller.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';
import { NotificationSegmentService } from './notification-segment.service.js';
import { MarketingAutomationService } from './marketing-automation.service.js';
import { MarketingController } from './marketing.controller.js';
import { PushNotificationProvider } from './push-notification-provider.interface.js';
import { ConsolePushNotificationProvider } from './providers/console-push.provider.js';
import { ExpoPushNotificationProvider } from './providers/expo-push.provider.js';
import { OneSignalPushNotificationProvider } from './providers/onesignal-push.provider.js';
import { MarketingEmailProvider } from './marketing-email-provider.interface.js';
import { ConsoleMarketingEmailProvider } from './providers/console-marketing-email.provider.js';
import { LoopsMarketingEmailProvider } from './providers/loops-marketing-email.provider.js';

@Module({
  imports: [ConfigModule, EmailModule, PrismaModule, RedisModule, UsersModule],
  controllers: [
    PushTokensController,
    NotificationPreferencesController,
    MarketingController,
  ],
  providers: [
    EmailNotificationService,
    CampaignEmailService,
    BackInStockAlertsService,
    AbandonedCartService,
    PushNotificationService,
    PushTokensService,
    NotificationPreferencesService,
    NotificationSegmentService,
    MarketingAutomationService,
    ConsolePushNotificationProvider,
    ExpoPushNotificationProvider,
    OneSignalPushNotificationProvider,
    ConsoleMarketingEmailProvider,
    LoopsMarketingEmailProvider,
    {
      provide: PushNotificationProvider,
      useFactory: (
        config: ConfigService,
        consoleProvider: ConsolePushNotificationProvider,
        expoProvider: ExpoPushNotificationProvider,
        oneSignalProvider: OneSignalPushNotificationProvider,
      ) => {
        const selected = config.get<string>('PUSH_PROVIDER', 'console');
        if (selected === 'expo') return expoProvider;
        if (selected === 'onesignal') return oneSignalProvider;
        return consoleProvider;
      },
      inject: [
        ConfigService,
        ConsolePushNotificationProvider,
        ExpoPushNotificationProvider,
        OneSignalPushNotificationProvider,
      ],
    },
    {
      provide: MarketingEmailProvider,
      useFactory: (
        config: ConfigService,
        consoleProvider: ConsoleMarketingEmailProvider,
        loopsProvider: LoopsMarketingEmailProvider,
      ) => {
        const selected = config.get<string>('MARKETING_EMAIL_PROVIDER', 'console');
        return selected === 'loops' ? loopsProvider : consoleProvider;
      },
      inject: [ConfigService, ConsoleMarketingEmailProvider, LoopsMarketingEmailProvider],
    },
  ],
  exports: [
    EmailNotificationService,
    CampaignEmailService,
    BackInStockAlertsService,
    PushNotificationService,
    MarketingEmailProvider,
    MarketingAutomationService,
    NotificationPreferencesService,
    NotificationSegmentService,
  ],
})
export class NotificationsModule {}
