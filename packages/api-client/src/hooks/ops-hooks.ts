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


export function createOpsHooks(client: ApiClient) {
  return {
    useMarketingPromotions: (
      options?: Omit<
        UseQueryOptions<Array<Pick<Promotion, 'id' | 'name'>>, Error>,
        'queryKey' | 'queryFn'
      >,
    ) =>
      useQuery({
        queryKey: queryKeys.marketingPromotions,
        queryFn: () => client.marketing.listPromotions(),
        ...options,
      }),


    useDistributePromo: (
      options?: UseMutationOptions<DistributePromoResponse, Error, DistributePromoDto>,
    ) =>
      useMutation({
        mutationFn: (data) => client.marketing.distributePromo(data),
        ...options,
      }),


    useUploadExpenseReceipt: (
      options?: UseMutationOptions<
        { key: string },
        Error,
        { expenseId: string; data: UploadExpenseReceiptDto }
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ expenseId, data }) =>
          client.finance.expenses.uploadReceipt(expenseId, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.financeExpenses() });
        },
        ...options,
      });
    },


    useRegisterPushToken: (
      options?: UseMutationOptions<
        { id: string; token: string; platform: string },
        Error,
        { token: string; platform: 'ios' | 'android' | 'web' }
      >,
    ) =>
      useMutation({
        mutationFn: (data) => client.notifications.pushTokens.register(data),
        ...options,
      }),


    useRemovePushToken: (
      options?: UseMutationOptions<void, Error, string>,
    ) =>
      useMutation({
        mutationFn: (token) => client.notifications.pushTokens.remove(token),
        ...options,
      }),

  };
}
