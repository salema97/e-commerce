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


export function createReturnsHooks(client: ApiClient) {
  return {
    useReturns: (
      filters?: Record<string, string | number | undefined>,
      options?: Omit<UseQueryOptions<ReturnRequest[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.returns(filters),
        queryFn: () => client.returns.findAll(filters),
        ...options,
      }),


    useReturn: (
      id: string,
      options?: Omit<UseQueryOptions<ReturnRequest, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.return(id),
        queryFn: () => client.returns.findOne(id),
        enabled: Boolean(id),
        ...options,
      }),


    useCreateReturnRequest: (
      options?: UseMutationOptions<ReturnRequest, Error, { orderId: string; data: CreateReturnRequestDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ orderId, data }) => client.returns.createForOrder(orderId, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
        },
        ...options,
      });
    },


    useCreateGuestReturnRequest: (
      options?: UseMutationOptions<ReturnRequest, Error, CreateGuestReturnRequestDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.returns.createGuest(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
        },
        ...options,
      });
    },


    useUpdateReturnStatus: (
      options?: UseMutationOptions<ReturnRequest, Error, { id: string; data: UpdateReturnStatusDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.returns.updateStatus(id, data),
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.returns() });
          queryClient.invalidateQueries({ queryKey: queryKeys.return(id) });
        },
        ...options,
      });
    },


    useResolveReturn: (
      options?: UseMutationOptions<ReturnRequest, Error, { id: string; data: ResolveReturnDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.returns.resolve(id, data),
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.returns() });
          queryClient.invalidateQueries({ queryKey: queryKeys.return(id) });
        },
        ...options,
      });
    },


    useMyStoreCredit: (
      options?: Omit<UseQueryOptions<StoreCreditBalance, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.storeCredit,
        queryFn: () => client.returns.myStoreCredit(),
        ...options,
      }),

  };
}
