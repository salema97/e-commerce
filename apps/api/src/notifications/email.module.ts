import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EmailProvider } from './email-provider.interface.js';
import { ConsoleEmailProvider } from './providers/console-email.provider.js';
import { ResendEmailProvider } from './providers/resend-email.provider.js';

/**
 * Registers the active {@link EmailProvider} implementation. Other modules
 * import this module and inject {@link EmailProvider} without knowing whether
 * the console or Resend transport is active.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    ConsoleEmailProvider,
    ResendEmailProvider,
    {
      provide: EmailProvider,
      useFactory: (
        config: ConfigService,
        consoleProvider: ConsoleEmailProvider,
        resendProvider: ResendEmailProvider,
      ) => {
        const selected = config.get<string>('EMAIL_PROVIDER', 'console');
        return selected === 'resend' ? resendProvider : consoleProvider;
      },
      inject: [ConfigService, ConsoleEmailProvider, ResendEmailProvider],
    },
  ],
  exports: [EmailProvider],
})
export class EmailModule {}
