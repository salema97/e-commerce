import { Injectable, Logger } from '@nestjs/common';
import { EmailProvider } from '../email-provider.interface.js';

/**
 * MVP console-only email provider.
 *
 * Logs the rendered email to the console instead of contacting a real email
 * service. This is useful for local development and early integration tests
 * before a transactional email provider is configured.
 */
@Injectable()
export class ConsoleEmailProvider extends EmailProvider {
  private readonly logger = new Logger(ConsoleEmailProvider.name);

  async sendTemplate(
    to: string,
    template: string,
    vars: Record<string, string>,
  ): Promise<void> {
    this.logger.log(
      { to, template, vars },
      'Console email provider would send templated email',
    );
  }
}
