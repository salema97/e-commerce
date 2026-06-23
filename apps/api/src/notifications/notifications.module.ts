import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { RedisModule } from '../common/redis/redis.module.js';
import { EmailModule } from './email.module.js';
import { EmailNotificationService } from './email-notification.service.js';
import { PushNotificationService } from './push-notification.service.js';
import { PushTokensService } from './push-tokens.service.js';
import { PushTokensController } from './push-tokens.controller.js';
import { PushNotificationProvider } from './push-notification-provider.interface.js';
import { ConsolePushNotificationProvider } from './providers/console-push.provider.js';
import { ExpoPushNotificationProvider } from './providers/expo-push.provider.js';
import { MarketingEmailProvider } from './marketing-email-provider.interface.js';
import { ConsoleMarketingEmailProvider } from './providers/console-marketing-email.provider.js';

@Module({
  imports: [ConfigModule, EmailModule, PrismaModule, RedisModule],
  controllers: [PushTokensController],
  providers: [
    EmailNotificationService,
    PushNotificationService,
    PushTokensService,
    ConsolePushNotificationProvider,
    ExpoPushNotificationProvider,
    ConsoleMarketingEmailProvider,
    {
      provide: PushNotificationProvider,
      useFactory: (
        config: ConfigService,
        consoleProvider: ConsolePushNotificationProvider,
        expoProvider: ExpoPushNotificationProvider,
      ) => {
        const selected = config.get<string>('PUSH_PROVIDER', 'console');
        return selected === 'expo' ? expoProvider : consoleProvider;
      },
      inject: [ConfigService, ConsolePushNotificationProvider, ExpoPushNotificationProvider],
    },
    {
      provide: MarketingEmailProvider,
      useClass: ConsoleMarketingEmailProvider,
    },
  ],
  exports: [
    EmailNotificationService,
    PushNotificationService,
    MarketingEmailProvider,
  ],
})
export class NotificationsModule {}
