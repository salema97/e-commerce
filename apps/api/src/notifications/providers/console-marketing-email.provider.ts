import { Injectable, Logger } from '@nestjs/common';
import {
  MarketingEmailProvider,
  type MarketingContactProfile,
} from '../marketing-email-provider.interface.js';

@Injectable()
export class ConsoleMarketingEmailProvider extends MarketingEmailProvider {
  private readonly logger = new Logger(ConsoleMarketingEmailProvider.name);

  async trackEvent(
    email: string,
    event: string,
    properties?: Record<string, string | number | boolean | undefined>,
  ): Promise<void> {
    this.logger.log({ email, event, properties }, 'Marketing event tracked (console)');
  }

  async syncContact(email: string, profile: MarketingContactProfile): Promise<void> {
    this.logger.log({ email, profile }, 'Marketing contact synced (console)');
  }
}
