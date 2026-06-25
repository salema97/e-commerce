import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppProvider } from './whatsapp-provider.interface.js';
import { EvolutionApiProvider } from './providers/evolution-api.provider.js';
import { ConfiguredWhatsAppProvider } from './configured-whatsapp.provider.js';
import { WhatsAppProviderWiring } from './whatsapp-provider.wiring.js';
import { WhatsAppController } from './whatsapp.controller.js';

/**
 * WhatsApp feature module.
 *
 * Registers the active {@link WhatsAppProvider} implementation. Other modules
 * import this module and inject {@link WhatsAppProvider} without knowing whether
 * the backend is Evolution API, Baileys, or WhatsApp Cloud API.
 */
@Module({
  imports: [ConfigModule],
  controllers: [WhatsAppController],
  providers: [
    EvolutionApiProvider,
    ConfiguredWhatsAppProvider,
    {
      provide: WhatsAppProvider,
      useExisting: ConfiguredWhatsAppProvider,
    },
    WhatsAppProviderWiring,
  ],
  exports: [WhatsAppProvider, WhatsAppProviderWiring],
})
export class WhatsAppModule {}
