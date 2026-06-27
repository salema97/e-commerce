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


export function createDiscoveryHooks(client: ApiClient) {
  return {
    useProductSearch: (
      query: string,
      options?: Omit<UseQueryOptions<SearchResultItem[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.search(query),
        queryFn: () => client.search.products(query),
        enabled: Boolean(query.trim()),
        ...options,
      }),


    useCatalog: (
      query?: CatalogQuery & { attr?: string | string[] },
      options?: Omit<UseQueryOptions<CatalogResponse, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.catalog(query as Record<string, string | number | boolean | undefined>),
        queryFn: () => client.catalog.browse(query),
        ...options,
      }),


    useCreateChatSession: (
      options?: UseMutationOptions<ChatSession, Error, { contactName?: string } | void>,
    ) =>
      useMutation({
        mutationFn: (data) => client.chat.createSession(data ?? undefined),
        ...options,
      }),


    useChatMessages: (
      sessionId: string,
      options?: Omit<UseQueryOptions<Message[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.chatMessages(sessionId),
        queryFn: () => client.chat.listMessages(sessionId),
        enabled: Boolean(sessionId),
        refetchInterval: 3_000,
        ...options,
      }),


    useSendChatMessage: (
      options?: UseMutationOptions<Message[], Error, { sessionId: string; content: string }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ sessionId, content }) => client.chat.sendMessage(sessionId, content),
        onSuccess: (_, { sessionId }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.chatMessages(sessionId) });
        },
        ...options,
      });
    },

  };
}
