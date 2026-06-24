export type AccountingProviderType = 'CONSOLE' | 'SIIGO' | 'ALEGRA';
export type AccountingSyncStatus = 'PENDING' | 'SYNCED' | 'FAILED';

export interface AccountingSyncRecord {
  id: string;
  provider: AccountingProviderType;
  resourceType: string;
  resourceId: string;
  externalId?: string | null;
  status: AccountingSyncStatus;
  lastError?: string | null;
  syncedAt?: string | null;
  createdAt: string;
}

export interface AccountingProviderProfile {
  id: AccountingProviderType;
  name: string;
  regions: string[];
}

export interface AccountingSyncResult {
  resourceType: string;
  resourceId: string;
  externalId?: string;
  status: AccountingSyncStatus;
}

export interface MarketplaceFeeReconciliation {
  orderId: string;
  orderNumber: string;
  channel: string;
  externalOrderId?: string | null;
  fees: number;
  orderTotal: number;
  syncStatus: AccountingSyncStatus | 'PENDING';
  syncedAt?: string | null;
}
