import type { CreateUserDto, UpdateUserDto } from './user.js';
import type { CreateCategoryDto, UpdateCategoryDto } from './category.js';
import type { CreateProductDto, UpdateProductDto } from './product.js';
import type { CreateInventoryDto, UpdateInventoryDto, ReserveInventoryDto } from './inventory.js';
import type { AddCartItemDto, UpdateCartItemDto, MergeCartDto } from './cart.js';
import type { CreateOrderDto, UpdateOrderStatusDto } from './order.js';
import type { CreatePaymentIntentDto } from './payment.js';
import type { CreateRefundDto } from './refund.js';
import type { IssueInvoiceDto } from './invoice.js';
import type { CreatePromotionDto, UpdatePromotionDto, CreateCouponDto, UpdateCouponDto, ApplyCouponDto } from './promotion.js';
import type { CreateSupplierDto, UpdateSupplierDto } from './supplier.js';
import type { SendMessageDto, UpdateConversationDto } from './conversation.js';
import type { CreateIncomeDto, UpdateIncomeDto, CreateExpenseDto, UpdateExpenseDto } from './finance.js';
import type { CreateAddressDto, UpdateAddressDto } from './address.js';

export interface ApiDtoMap {
  User: { create: CreateUserDto; update: UpdateUserDto };
  Category: { create: CreateCategoryDto; update: UpdateCategoryDto };
  Product: { create: CreateProductDto; update: UpdateProductDto };
  Inventory: { create: CreateInventoryDto; update: UpdateInventoryDto; reserve: ReserveInventoryDto };
  Cart: { addItem: AddCartItemDto; updateItem: UpdateCartItemDto; merge: MergeCartDto };
  Order: { create: CreateOrderDto; updateStatus: UpdateOrderStatusDto };
  Payment: { createIntent: CreatePaymentIntentDto };
  Refund: { create: CreateRefundDto };
  Invoice: { issue: IssueInvoiceDto };
  Promotion: { create: CreatePromotionDto; update: UpdatePromotionDto };
  Coupon: { create: CreateCouponDto; update: UpdateCouponDto; apply: ApplyCouponDto };
  Supplier: { create: CreateSupplierDto; update: UpdateSupplierDto };
  Conversation: { sendMessage: SendMessageDto; update: UpdateConversationDto };
  Income: { create: CreateIncomeDto; update: UpdateIncomeDto };
  Expense: { create: CreateExpenseDto; update: UpdateExpenseDto };
  Address: { create: CreateAddressDto; update: UpdateAddressDto };
}

export type ApiDtoKind = keyof ApiDtoMap;

export type ApiOperation = 'create' | 'update' | 'delete' | 'findOne' | 'findAll';

export interface ApiErrorResponse {
  statusCode: number;
  message: string;
  error?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}
