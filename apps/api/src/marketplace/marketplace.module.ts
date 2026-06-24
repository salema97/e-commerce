import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PrismaModule } from '../prisma/prisma.module.js';
import { InventoryModule } from '../inventory/inventory.module.js';
import { MarketplaceController } from './marketplace.controller.js';
import { MarketplaceService } from './marketplace.service.js';
import { MarketplaceChannelFactory } from './marketplace.factory.js';
import { ConsoleMarketplaceAdapter } from './console-marketplace.adapter.js';
import { MercadoLibreMarketplaceAdapter } from './mercado-libre-marketplace.adapter.js';

@Module({
  imports: [ConfigModule, PrismaModule, InventoryModule],
  controllers: [MarketplaceController],
  providers: [
    MarketplaceService,
    MarketplaceChannelFactory,
    ConsoleMarketplaceAdapter,
    MercadoLibreMarketplaceAdapter,
  ],
  exports: [MarketplaceService, MarketplaceChannelFactory],
})
export class MarketplaceModule {}
