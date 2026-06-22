/**
 * Shared runtime-free enums mirrored from the Prisma schema.
 * These are string literals so the package remains runtime-free.
 */

export type Role =
  | 'SUPER_ADMIN'
  | 'ADMIN'
  | 'FINANCE'
  | 'INVENTORY'
  | 'SUPPORT'
  | 'CUSTOMER'
  | 'GUEST';

export type ProductStatus = 'DRAFT' | 'ACTIVE' | 'ARCHIVED';

export type OrderStatus =
  | 'PENDING'
  | 'PAYMENT_PENDING'
  | 'PAYMENT_FAILED'
  | 'PROCESSING'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
  | 'REFUNDED'
  | 'PARTIALLY_REFUNDED';

export type PaymentChannel = 'WEB' | 'MOBILE';

export type PaymentStatus = 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';

export type PaymentProvider =
  | 'STRIPE'
  | 'KUSHKI'
  | 'PAYPHONE'
  | 'MERCADOPAGO'
  | 'PLACETOPAY'
  | 'CASH';

export type RefundStatus = 'PENDING' | 'COMPLETED' | 'REJECTED';

export type InvoiceStatus = 'DRAFT' | 'SUBMITTED' | 'AUTHORIZED' | 'REJECTED' | 'FAILED';

export type PromotionType = 'PERCENTAGE' | 'FIXED_AMOUNT' | 'FREE_SHIPPING' | 'BUNDLE' | 'TIERED';

export type ConversationStatus = 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED';

export type IncomeSource = 'ORDER' | 'INVESTMENT' | 'OTHER';

export type ExpenseStatus = 'PENDING' | 'PAID' | 'CANCELLED';

export type MessageDirection = 'INBOUND' | 'OUTBOUND';

export type MessageStatus = 'SENT' | 'DELIVERED' | 'READ' | 'FAILED';
