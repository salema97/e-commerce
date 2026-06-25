import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { UsersModule } from '../users/users.module.js';
import { RedisModule } from '../common/redis/redis.module.js';
import { ReceiptsModule } from '../receipts/receipts.module.js';
import { WhatsAppNotificationModule } from '../whatsapp/whatsapp-notification.module.js';
import { WhatsAppModule } from '../whatsapp/whatsapp.module.js';
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
import { OrderConfirmationService } from './order-confirmation.service.js';
import { OrderPaidDomainConsumer } from './order-paid-domain.consumer.js';
import {
  ConfiguredMarketingEmailProvider,
  ConfiguredPushNotificationProvider,
} from './configured-notification.providers.js';
import { NotificationProviderWiring } from './notification-provider.wiring.js';

@Module({
  imports: [ConfigModule, EmailModule, PrismaModule, RedisModule, UsersModule, ReceiptsModule, WhatsAppNotificationModule, WhatsAppModule],
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
    OrderConfirmationService,
    OrderPaidDomainConsumer,
    ConsolePushNotificationProvider,
    ExpoPushNotificationProvider,
    OneSignalPushNotificationProvider,
    ConsoleMarketingEmailProvider,
    LoopsMarketingEmailProvider,
    ConfiguredPushNotificationProvider,
    ConfiguredMarketingEmailProvider,
    {
      provide: PushNotificationProvider,
      useExisting: ConfiguredPushNotificationProvider,
    },
    {
      provide: MarketingEmailProvider,
      useExisting: ConfiguredMarketingEmailProvider,
    },
    NotificationProviderWiring,
  ],
  exports: [
    EmailNotificationService,
    CampaignEmailService,
    BackInStockAlertsService,
    PushNotificationService,
    MarketingEmailProvider,
    MarketingAutomationService,
    OrderConfirmationService,
    NotificationPreferencesService,
    NotificationSegmentService,
  ],
})
export class NotificationsModule {}
