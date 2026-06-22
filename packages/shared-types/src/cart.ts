export interface CartItem {
  id: string;
  cartId: string;
  productId: string;
  variantId?: string | null;
  quantity: number;
  createdAt: string;
  updatedAt: string;
  product?: unknown;
  variant?: unknown;
}

export interface Cart {
  id: string;
  userId?: string | null;
  sessionId?: string | null;
  createdAt: string;
  updatedAt: string;
  items: CartItem[];
}

export interface AddCartItemDto {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface UpdateCartItemDto {
  quantity: number;
}

export interface MergeCartDto {
  sessionCartId: string;
  userCartId: string;
}
