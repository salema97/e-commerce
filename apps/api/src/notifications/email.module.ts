import { Injectable } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { Module } from '@nestjs/common';
import { EmailProvider } from './email-provider.interface.js';
import { ConsoleEmailProvider } from './providers/console-email.provider.js';
import { ResendEmailProvider } from './providers/resend-email.provider.js';
import { ConfiguredEmailProvider } from './configured-email.provider.js';
import { EmailProviderWiring } from './email-provider.wiring.js';

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
    ConfiguredEmailProvider,
    EmailProviderWiring,
    {
      provide: EmailProvider,
      useExisting: ConfiguredEmailProvider,
    },
  ],
  exports: [EmailProvider, EmailProviderWiring],
})
export class EmailModule {}
