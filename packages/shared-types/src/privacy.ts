export interface PrivacyExportBundle {
  exportedAt: string;
  user: {
    id: string;
    email: string;
    name?: string | null;
    phone?: string | null;
    role: string;
    createdAt: string;
  };
  addresses: unknown[];
  orders: unknown[];
  returns: unknown[];
  loyalty?: unknown;
  referrals?: unknown;
  quotes: unknown[];
  notificationPreferences: {
    whatsappOptOut: boolean;
    emailOptOut: boolean;
    marketingEmailOptOut: boolean;
    ccpaDoNotSell: boolean;
  };
}

export interface PrivacyDeletionResult {
  userId: string;
  anonymized: boolean;
  deletedAt: string;
  message: string;
}

export interface CcpaOptOutResult {
  userId: string;
  ccpaDoNotSell: boolean;
  updatedAt: string;
}
