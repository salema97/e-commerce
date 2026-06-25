export type SellerStatus = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'REJECTED';

export type FulfillmentSource = 'WAREHOUSE' | 'DROPSHIP' | 'SELLER';

export type SellerPayoutStatus = 'PENDING' | 'PROCESSING' | 'PAID' | 'FAILED';

export type MarketplaceDisputeStatus =
  | 'OPEN'
  | 'UNDER_REVIEW'
  | 'RESOLVED_BUYER'
  | 'RESOLVED_SELLER'
  | 'CLOSED';

export interface Seller {
  id: string;
  userId: string;
  businessName: string;
  slug: string;
  commissionRate: number;
  status: SellerStatus;
  createdAt: string;
  updatedAt: string;
  user?: unknown;
  products?: unknown[];
}

export interface SellerPayout {
  id: string;
  sellerId: string;
  orderId?: string | null;
  grossAmount: number;
  commissionAmount: number;
  netAmount: number;
  status: SellerPayoutStatus;
  paidAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface MarketplaceDispute {
  id: string;
  orderId: string;
  sellerId: string;
  openedByUserId: string;
  reason: string;
  status: MarketplaceDisputeStatus;
  resolutionNotes?: string | null;
  resolvedAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSellerDto {
  userId: string;
  businessName: string;
  slug: string;
  commissionRate?: number;
}

export interface UpdateSellerDto {
  businessName?: string;
  slug?: string;
  commissionRate?: number;
  status?: SellerStatus;
}

export interface CreateMarketplaceDisputeDto {
  orderId: string;
  sellerId: string;
  reason: string;
}

export interface ResolveMarketplaceDisputeDto {
  status: Extract<MarketplaceDisputeStatus, 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'CLOSED'>;
  resolutionNotes?: string;
}
