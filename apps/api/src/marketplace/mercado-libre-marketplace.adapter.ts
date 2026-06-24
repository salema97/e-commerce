import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { MarketplaceChannel, MarketplaceListingStatus } from '@prisma/client';
import type {
  MarketplaceChannelAdapter,
  MarketplaceImportOrderInput,
  MarketplaceSyncInput,
  MarketplaceSyncResult,
} from './marketplace-channel.adapter.js';

@Injectable()
export class MercadoLibreMarketplaceAdapter implements MarketplaceChannelAdapter {
  readonly channel = MarketplaceChannel.MERCADO_LIBRE;
  private readonly logger = new Logger(MercadoLibreMarketplaceAdapter.name);

  constructor(private readonly config: ConfigService) {}

  private get configured(): boolean {
    return Boolean(this.config.get<string>('MERCADO_LIBRE_ACCESS_TOKEN'));
  }

  async syncListing(input: MarketplaceSyncInput): Promise<MarketplaceSyncResult> {
    if (!this.configured) {
      this.logger.warn('Mercado Libre not configured; using stub external id');
    }
    return {
      externalId: `ml-${input.productId}`,
      status: MarketplaceListingStatus.PUBLISHED,
    };
  }

  async importOrder(input: MarketplaceImportOrderInput): Promise<{ externalOrderId: string }> {
    this.logger.debug(`[mercado_libre] import order ${input.externalOrderId}`);
    return { externalOrderId: input.externalOrderId };
  }
}
