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


export function createPaymentsHooks(client: ApiClient) {
  return {
    useCreateRefund: (
      options?: UseMutationOptions<Refund, Error, { orderId: string; data: CreateRefundDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ orderId, data }) => client.orders.createRefund(orderId, data),
        onSuccess: (_, { orderId }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
          queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.orderRefunds(orderId) });
        },
        ...options,
      });
    },


    useApproveRefund: (options?: UseMutationOptions<Refund, Error, string>) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (refundId) => client.refunds.approve(refundId),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
        },
        ...options,
      });
    },


    useListRefunds: (
      orderId: string,
      options?: Omit<UseQueryOptions<Refund[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.orderRefunds(orderId),
        queryFn: () => client.orders.listRefunds(orderId),
        enabled: Boolean(orderId),
        ...options,
      }),


    useGenerateReceipt: (
      options?: UseMutationOptions<ReceiptResponse, Error, string>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (orderId) => client.orders.generateReceipt(orderId),
        onSuccess: (_, orderId) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
        },
        ...options,
      });
    },


    useGetReceipt: (
      orderId: string,
      options?: Omit<UseQueryOptions<ReceiptResponse, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.orderReceipt(orderId),
        queryFn: () => client.orders.getReceipt(orderId),
        enabled: Boolean(orderId),
        ...options,
      }),

  };
}
