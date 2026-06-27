import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { StorageModule } from '../storage/storage.module.js';
import { WhatsAppProvider } from './whatsapp-provider.interface.js';
import { EvolutionApiProvider } from './providers/evolution-api.provider.js';
import { ConfiguredWhatsAppProvider } from './configured-whatsapp.provider.js';
import { WhatsAppProviderWiring } from './whatsapp-provider.wiring.js';
import { WhatsAppController } from './whatsapp.controller.js';
import { WhatsAppQuickReplyService } from './whatsapp-quick-reply.service.js';
import { EvolutionMediaService } from './evolution-media.service.js';
import { WhatsAppMediaService } from './whatsapp-media.service.js';

/**
 * WhatsApp feature module.
 *
 * Registers the active {@link WhatsAppProvider} implementation. Other modules
 * import this module and inject {@link WhatsAppProvider} without knowing whether
 * the backend is Evolution API, Baileys, or WhatsApp Cloud API.
 */
@Module({
  imports: [ConfigModule, PrismaModule, StorageModule],
  controllers: [WhatsAppController],
  providers: [
    WhatsAppQuickReplyService,
    EvolutionApiProvider,
    EvolutionMediaService,
    WhatsAppMediaService,
    ConfiguredWhatsAppProvider,
    {
      provide: WhatsAppProvider,
      useExisting: ConfiguredWhatsAppProvider,
    },
    WhatsAppProviderWiring,
  ],
  exports: [WhatsAppProvider, WhatsAppProviderWiring, WhatsAppMediaService],
})
export class WhatsAppModule {}
