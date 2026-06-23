import { Module } from '@nestjs/common';
import { EmailProvider } from './email-provider.interface.js';
import { ConsoleEmailProvider } from './providers/console-email.provider.js';

/**
 * Email provider module.
 *
 * Registers the active {@link EmailProvider} implementation. Other modules
 * import this module and inject {@link EmailProvider} without knowing whether
 * the backend is Resend, Loops, SendGrid, or the console-only adapter.
 */
@Module({
  providers: [
    {
      provide: EmailProvider,
      useClass: ConsoleEmailProvider,
    },
  ],
  exports: [EmailProvider],
})
export class EmailModule {}
