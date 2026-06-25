import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketplaceChannel } from '@prisma/client';
import { ConsoleMarketplaceAdapter } from './console-marketplace.adapter.js';
import { MercadoLibreMarketplaceAdapter } from './mercado-libre-marketplace.adapter.js';
import type { MarketplaceChannelAdapter } from './marketplace-channel.adapter.js';

@Injectable()
export class MarketplaceChannelFactory {
  constructor(
    private readonly config: ConfigService,
    private readonly consoleAdapter: ConsoleMarketplaceAdapter,
    private readonly mercadoLibreAdapter: MercadoLibreMarketplaceAdapter,
  ) {}

  getAdapter(channel?: MarketplaceChannel): MarketplaceChannelAdapter {
    const selected =
      channel ??
      (this.config.get<string>('MARKETPLACE_CHANNEL', 'console').toUpperCase() as MarketplaceChannel);

    switch (selected) {
      case MarketplaceChannel.MERCADO_LIBRE:
        return this.mercadoLibreAdapter;
      case MarketplaceChannel.CONSOLE:
      default:
        return this.consoleAdapter;
    }
  }

  listProfiles() {
    return [
      { id: MarketplaceChannel.CONSOLE, name: 'Console (dev)', regions: ['*'] },
      { id: MarketplaceChannel.MERCADO_LIBRE, name: 'Mercado Libre', regions: ['LATAM', 'EC'] },
    ];
  }
}
