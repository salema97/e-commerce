import {
  useQuery,
  useMutation,
  useQueryClient,
  type UseQueryOptions,
  type UseMutationOptions,
} from '@tanstack/react-query';
import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  Product,
  CreateProductDto,
  UpdateProductDto,
  Order,
  CreateOrderDto,
  CreatedOrderResult,
  UpdateOrderStatusDto,
  CreatePaymentIntentDto,
  PaymentIntentResult,
  Cart,
  AddCartItemDto,
  UpdateCartItemDto,
  User,
  AuthUser,
  Supplier,
  CreateSupplierDto,
  UpdateSupplierDto,
  Inventory,
  CreateInventoryDto,
  UpdateInventoryDto,
  IssueInvoiceDto,
  InvoiceResponseDto,
  CreditNoteResponse,
  CreateRefundDto,
  Refund,
  ReceiptResponse,
  PaginatedResponse,
  ReturnRequest,
  CreateReturnRequestDto,
  CreateGuestReturnRequestDto,
  UpdateReturnStatusDto,
  ResolveReturnDto,
  StoreCreditBalance,
  Conversation,
  Message,
  PaginatedConversations,
  PaginatedMessages,
  QuickReply,
  Income,
  CreateIncomeDto,
  UpdateIncomeDto,
  ExpenseCategory,
  CreateExpenseCategoryDto,
  UpdateExpenseCategoryDto,
  Expense,
  CreateExpenseDto,
  UpdateExpenseDto,
  UploadExpenseReceiptDto,
  CashFlowReport,
  AdminStoreCredit,
  SearchResultItem,
  Faq,
  CreateFaqDto,
  UpdateFaqDto,
  CmsPage,
  CreateCmsPageDto,
  UpdateCmsPageDto,
  ProductContentDraft,
  ChatSession,
  Promotion,
  DistributePromoDto,
  DistributePromoResponse,
  AnalyticsOverviewReport,
  CohortRetentionReport,
  CatalogResponse,
  CatalogQuery,
  ProductReview,
  ProductReviewSummary,
  CreateProductReviewDto,
  UpdateReviewStatusDto,
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyRedemptionQuote,
  ReferralCode,
  ReferralPerformanceReport,
  PayoutReferralDto,
  Company,
  Quote,
  MarketplaceListing,
  MarketplaceChannelProfile,
  AccountingSyncRecord,
  AccountingProviderProfile,
  MarketplaceFeeReconciliation,
  CreateCompanyDto,
  UpdateCompanyDto,
  UpsertCompanyPriceDto,
  CreateQuoteDto,
  UpdateQuoteStatusDto,
  ConvertQuoteResult,
  MarketplaceImportOrderDto,
  PrivacyExportBundle,
  PrivacyDeletionResult,
  CcpaOptOutResult,
} from '@repo/shared-types';
import type { ApiClient } from '../client.js';
import { queryKeys } from '../query-keys.js';


export function createCommerceHooks(client: ApiClient) {
  return {
    useOrders: (
      filters?: Record<string, string | number | undefined>,
      options?: Omit<UseQueryOptions<PaginatedResponse<Order>, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.orders(filters),
        queryFn: () => client.orders.findAll(filters),
        ...options,
      }),


    useOrder: (
      id: string,
      options?: Omit<UseQueryOptions<Order, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.order(id),
        queryFn: () => client.orders.findOne(id),
        enabled: Boolean(id),
        ...options,
      }),


    useCreateOrder: (
      options?: UseMutationOptions<CreatedOrderResult, Error, CreateOrderDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.orders.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders() }),
        ...options,
      });
    },


    useUpdateOrderStatus: (
      options?: UseMutationOptions<Order, Error, { id: string; data: UpdateOrderStatusDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.orders.updateStatus(id, data),
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
          queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
        },
        ...options,
      });
    },


    useCreatePaymentIntent: (
      options?: UseMutationOptions<PaymentIntentResult, Error, CreatePaymentIntentDto>,
    ) => useMutation({ mutationFn: (data) => client.payments.createIntent(data), ...options }),


    useCart: (
      id: string,
      options?: Omit<UseQueryOptions<Cart, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.cart(id),
        queryFn: () => client.cart.findOne(id),
        enabled: Boolean(id),
        ...options,
      }),


    useAddCartItem: (
      options?: UseMutationOptions<Cart, Error, { cartId: string; data: AddCartItemDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ cartId, data }) => client.cart.addItem(data),
        onSuccess: (_, { cartId }) => queryClient.invalidateQueries({ queryKey: queryKeys.cart(cartId) }),
        ...options,
      });
    },


    useUpdateCartItem: (
      options?: UseMutationOptions<Cart, Error, { cartId: string; id: string; data: UpdateCartItemDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.cart.updateItem(id, data),
        onSuccess: (_, { cartId }) => queryClient.invalidateQueries({ queryKey: queryKeys.cart(cartId) }),
        ...options,
      });
    },


    useRemoveCartItem: (
      options?: UseMutationOptions<Cart, Error, { cartId: string; id: string }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id }) => client.cart.removeItem(id),
        onSuccess: (_, { cartId }) => queryClient.invalidateQueries({ queryKey: queryKeys.cart(cartId) }),
        ...options,
      });
    },

  };
}
