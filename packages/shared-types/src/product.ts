import type { ProductStatus } from './enums.js';

export interface ProductImage {
  id: string;
  productId: string;
  url: string;
  alt?: string | null;
  sortOrder: number;
  createdAt: string;
}

export interface ProductAttribute {
  id: string;
  productId: string;
  name: string;
  value: string;
  createdAt: string;
}

export interface ProductVariant {
  id: string;
  productId: string;
  sku: string;
  name: string;
  price?: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface Product {
  id: string;
  name: string;
  slug: string;
  description?: string | null;
  sku?: string | null;
  status: ProductStatus;
  price: number;
  compareAtPrice?: number | null;
  cost?: number | null;
  isFeatured: boolean;
  isPreOrder?: boolean;
  preOrderReleaseDate?: string | null;
  preOrderChargeTiming?: 'AT_SHIPPING' | 'UPFRONT' | null;
  averageRating?: number | null;
  reviewCount?: number;
  categoryId?: string | null;
  supplierId?: string | null;
  sellerId?: string | null;
  isSubscription?: boolean;
  createdAt: string;
  updatedAt: string;
  category?: unknown;
  supplier?: unknown;
  variants?: ProductVariant[];
  attributes?: ProductAttribute[];
  images?: ProductImage[];
  inventory?: unknown[];
}

export interface CreateProductVariantDto {
  sku: string;
  name: string;
  price?: number;
}

export interface CreateProductAttributeDto {
  name: string;
  value: string;
}

export interface CreateProductImageDto {
  url: string;
  alt?: string;
  sortOrder?: number;
}

export interface CreateProductDto {
  name: string;
  slug: string;
  description?: string;
  sku?: string;
  status?: ProductStatus;
  price: number;
  compareAtPrice?: number;
  cost?: number;
  isFeatured?: boolean;
  categoryId?: string;
  supplierId?: string;
  sellerId?: string;
  isSubscription?: boolean;
  variants?: CreateProductVariantDto[];
  attributes?: CreateProductAttributeDto[];
  images?: CreateProductImageDto[];
}

export type UpdateProductDto = Partial<CreateProductDto>;
