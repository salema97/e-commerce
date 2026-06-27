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


export function createReviewsHooks(client: ApiClient) {
  return {
    useProductReviews: (
      productId: string,
      options?: Omit<UseQueryOptions<ProductReview[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.productReviews(productId),
        queryFn: () => client.reviews.listByProduct(productId),
        enabled: Boolean(productId),
        ...options,
      }),


    useProductReviewSummary: (
      productId: string,
      options?: Omit<UseQueryOptions<ProductReviewSummary, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.productReviewSummary(productId),
        queryFn: () => client.reviews.summary(productId),
        enabled: Boolean(productId),
        ...options,
      }),


    useCreateProductReview: (
      options?: UseMutationOptions<
        ProductReview,
        Error,
        { productId: string; data: CreateProductReviewDto }
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ productId, data }) => client.reviews.create(productId, data),
        onSuccess: (_, { productId }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.productReviews(productId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.productReviewSummary(productId) });
        },
        ...options,
      });
    },


    usePendingReviews: (
      options?: Omit<UseQueryOptions<ProductReview[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.pendingReviews,
        queryFn: () => client.reviews.listPending(),
        ...options,
      }),


    useModerateReview: (
      options?: UseMutationOptions<
        ProductReview,
        Error,
        { id: string; data: UpdateReviewStatusDto }
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.reviews.moderate(id, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.pendingReviews });
        },
        ...options,
      });
    },

  };
}
