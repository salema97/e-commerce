export type MarketplaceChannel = 'CONSOLE' | 'MERCADO_LIBRE';
export type MarketplaceListingStatus = 'DRAFT' | 'PUBLISHED' | 'ERROR' | 'UNPUBLISHED';
export type MarketplaceImportStatus = 'PENDING' | 'IMPORTED' | 'FAILED';

export interface MarketplaceListing {
  id: string;
  productId: string;
  channel: MarketplaceChannel;
  externalId?: string | null;
  status: MarketplaceListingStatus;
  lastSyncedAt?: string | null;
  lastError?: string | null;
}

export interface MarketplaceOrderImport {
  id: string;
  channel: MarketplaceChannel;
  externalOrderId: string;
  orderId?: string | null;
  status: MarketplaceImportStatus;
  fees?: number | null;
}

export interface MarketplaceChannelProfile {
  id: MarketplaceChannel;
  name: string;
  regions: string[];
}

export interface MarketplaceSyncResult {
  productId: string;
  channel: MarketplaceChannel;
  externalId?: string;
  status: MarketplaceListingStatus;
}

export interface MarketplaceImportOrderDto {
  channel: MarketplaceChannel;
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
