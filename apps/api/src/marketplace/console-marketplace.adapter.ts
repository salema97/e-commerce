import { Injectable, Logger } from '@nestjs/common';
import { MarketplaceChannel, MarketplaceListingStatus } from '@prisma/client';
import type {
  MarketplaceChannelAdapter,
  MarketplaceImportOrderInput,
  MarketplaceSyncInput,
  MarketplaceSyncResult,
} from './marketplace-channel.adapter.js';

@Injectable()
export class ConsoleMarketplaceAdapter implements MarketplaceChannelAdapter {
  readonly channel = MarketplaceChannel.CONSOLE;
  private readonly logger = new Logger(ConsoleMarketplaceAdapter.name);

  syncListing(input: MarketplaceSyncInput): Promise<MarketplaceSyncResult> {
    this.logger.debug(`[console] sync listing ${input.productId}`);
    return Promise.resolve({
      externalId: `console-${input.productId}`,
      status: MarketplaceListingStatus.PUBLISHED,
    });
  }

  importOrder(input: MarketplaceImportOrderInput): Promise<{ externalOrderId: string }> {
    this.logger.debug(`[console] import order ${input.externalOrderId}`);
    return Promise.resolve({ externalOrderId: input.externalOrderId });
  }
}
