import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppProvider } from './whatsapp-provider.interface.js';
import { EvolutionApiProvider } from './providers/evolution-api.provider.js';

/**
 * WhatsApp feature module.
 *
 * Registers the active {@link WhatsAppProvider} implementation. Other modules
 * import this module and inject {@link WhatsAppProvider} without knowing whether
 * the backend is Evolution API, Baileys, or WhatsApp Cloud API.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: WhatsAppProvider,
      useClass: EvolutionApiProvider,
    },
  ],
  exports: [WhatsAppProvider],
})
export class WhatsAppModule {}
