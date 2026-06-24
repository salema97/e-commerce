export type CompanyUserRole = 'OWNER' | 'BUYER' | 'APPROVER' | 'VIEWER';
export type NetPaymentTerms = 'NET_0' | 'NET_15' | 'NET_30' | 'NET_60';

export interface Company {
  id: string;
  name: string;
  taxId: string;
  creditLimit: number;
  creditUsed: number;
  netPaymentTerms: NetPaymentTerms;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  users?: CompanyUser[];
}

export interface CompanyUser {
  id: string;
  companyId: string;
  userId: string;
  role: CompanyUserRole;
  createdAt: string;
  user?: { email?: string; name?: string | null };
}

export interface CompanyPriceListItem {
  id: string;
  companyId: string;
  productId: string;
  variantId?: string | null;
  unitPrice: number;
  minQuantity: number;
}

export interface CreateCompanyDto {
  name: string;
  taxId: string;
  creditLimit?: number;
  netPaymentTerms?: NetPaymentTerms;
}

export interface UpdateCompanyDto {
  name?: string;
  creditLimit?: number;
  netPaymentTerms?: NetPaymentTerms;
  isActive?: boolean;
}

export interface UpsertCompanyPriceDto {
  productId: string;
  variantId?: string;
  unitPrice: number;
  minQuantity?: number;
}

export interface BulkOrderRowDto {
  productId: string;
  variantId?: string;
  quantity: number;
  sku?: string;
}

export interface BulkOrderImportResult {
  quoteId: string;
  quoteNumber: string;
  rowsProcessed: number;
  errors: Array<{ row: number; message: string }>;
}
