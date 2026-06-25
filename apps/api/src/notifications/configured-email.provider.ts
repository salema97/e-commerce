import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailProvider } from './email-provider.interface.js';
import { ConsoleEmailProvider } from './providers/console-email.provider.js';
import { ResendEmailProvider } from './providers/resend-email.provider.js';

@Injectable()
export class ConfiguredEmailProvider extends EmailProvider {
  private readonly delegate: EmailProvider;

  constructor(
    config: ConfigService,
    consoleProvider: ConsoleEmailProvider,
    resendProvider: ResendEmailProvider,
  ) {
    super();
    const selected = config.get<string>('EMAIL_PROVIDER', 'console');
    this.delegate = selected === 'resend' ? resendProvider : consoleProvider;
  }

  sendTemplate(
    to: string,
    template: string,
    vars: Record<string, string>,
    options?: Parameters<EmailProvider['sendTemplate']>[3],
  ): Promise<void> {
    return this.delegate.sendTemplate(to, template, vars, options);
  }
}
