export interface Inventory {
  id: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  reservedQuantity: number;
  lowStockThreshold?: number | null;
  updatedAt: string;
  product?: unknown;
  variant?: unknown;
}

export interface CreateInventoryDto {
  productId: string;
  variantId?: string;
  quantity?: number;
  reservedQuantity?: number;
  lowStockThreshold?: number;
}

export type UpdateInventoryDto = Partial<CreateInventoryDto>;

export interface ReserveInventoryDto {
  quantity: number;
}

export interface InventoryReservationResult {
  productId: string;
  variantId?: string | null;
  requestedQuantity: number;
  availableQuantity: number;
  reserved: boolean;
}
