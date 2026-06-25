import { Injectable } from '@nestjs/common';
import {
  ConfiguredMarketingEmailProvider,
  ConfiguredPushNotificationProvider,
} from './configured-notification.providers.js';

@Injectable()
export class NotificationProviderWiring {
  constructor(
    private readonly push: ConfiguredPushNotificationProvider,
    private readonly marketingEmail: ConfiguredMarketingEmailProvider,
  ) {}
}
