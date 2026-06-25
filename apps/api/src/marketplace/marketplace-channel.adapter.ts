import type { MarketplaceChannel, MarketplaceListingStatus } from '@prisma/client';

export interface MarketplaceSyncInput {
  productId: string;
  title: string;
  description?: string | null;
  price: number;
  stock: number;
  sku?: string | null;
}

export interface MarketplaceSyncResult {
  externalId: string;
  status: MarketplaceListingStatus;
}

export interface MarketplaceImportOrderInput {
  externalOrderId: string;
  customerEmail: string;
  customerName?: string;
  fees?: number;
  items: Array<{
    productId: string;
    variantId?: string;
    quantity: number;
    price: number;
    name: string;
    sku: string;
  }>;
}

export interface MarketplaceChannelAdapter {
  readonly channel: MarketplaceChannel;
  syncListing(input: MarketplaceSyncInput): Promise<MarketplaceSyncResult>;
  importOrder(input: MarketplaceImportOrderInput): Promise<{ externalOrderId: string }>;
}
