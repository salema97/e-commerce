export interface StoreLocation {
  id: string;
  code: string;
  name: string;
  address: string;
  city?: string | null;
  province?: string | null;
  phone?: string | null;
  supportsPickup: boolean;
  supportsPos: boolean;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  registers?: PosRegister[];
}

export interface PosRegister {
  id: string;
  locationId: string;
  code: string;
  name: string;
  isActive: boolean;
  lastClosedAt?: string | null;
  createdAt: string;
  updatedAt: string;
  location?: StoreLocation;
}

export interface CreateStoreLocationDto {
  code: string;
  name: string;
  address: string;
  city?: string;
  province?: string;
  phone?: string;
  supportsPickup?: boolean;
  supportsPos?: boolean;
  isActive?: boolean;
}

export type UpdateStoreLocationDto = Partial<CreateStoreLocationDto>;

export interface CreatePosRegisterDto {
  locationId: string;
  code: string;
  name: string;
  isActive?: boolean;
}

export type UpdatePosRegisterDto = Partial<Omit<CreatePosRegisterDto, 'locationId'>>;

export interface CreatePosOrderDto {
  posRegisterId: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  customerIdentification?: string;
  paymentProvider: 'CASH' | 'STRIPE';
  items: Array<{ productId: string; variantId?: string; quantity: number }>;
  notes?: string;
}
