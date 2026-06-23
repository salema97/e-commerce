import { Injectable, Logger } from '@nestjs/common';
import { MarketingEmailProvider } from '../marketing-email-provider.interface.js';

@Injectable()
export class ConsoleMarketingEmailProvider extends MarketingEmailProvider {
  private readonly logger = new Logger(ConsoleMarketingEmailProvider.name);

  async trackEvent(
    email: string,
    event: string,
    properties?: Record<string, string | number | boolean>,
  ): Promise<void> {
    this.logger.log({ email, event, properties }, 'Console marketing provider would track event');
  }
}
