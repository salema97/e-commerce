export interface Supplier {
  id: string;
  name: string;
  rucOrId?: string | null;
  contactName?: string | null;
  email?: string | null;
  phone?: string | null;
  address?: string | null;
  paymentTerms?: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  products?: unknown[];
  expenses?: unknown[];
}

export interface CreateSupplierDto {
  name: string;
  rucOrId?: string;
  contactName?: string;
  email?: string;
  phone?: string;
  address?: string;
  paymentTerms?: string;
  isActive?: boolean;
}

export type UpdateSupplierDto = Partial<CreateSupplierDto>;
