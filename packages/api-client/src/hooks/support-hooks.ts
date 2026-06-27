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


export function createSupportHooks(client: ApiClient) {
  return {
    useConversations: (
      filters?: Record<string, string | undefined>,
      options?: Omit<UseQueryOptions<PaginatedConversations, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.conversations(filters),
        queryFn: () => client.conversations.findAll(filters),
        refetchInterval: 10_000,
        ...options,
      }),


    useConversation: (
      id: string,
      options?: Omit<UseQueryOptions<Conversation, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.conversation(id),
        queryFn: () => client.conversations.findOne(id),
        enabled: Boolean(id),
        refetchInterval: 10_000,
        ...options,
      }),


    useUpdateConversation: (
      options?: UseMutationOptions<Conversation, Error, { id: string; data: { status?: string; assignedAgentId?: string } }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.conversations.update(id, data),
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
          queryClient.invalidateQueries({ queryKey: queryKeys.conversation(id) });
        },
        ...options,
      });
    },


    useMessages: (
      conversationId: string,
      options?: Omit<UseQueryOptions<PaginatedMessages, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.messages(conversationId),
        queryFn: () => client.messages.findAll(conversationId),
        enabled: Boolean(conversationId),
        refetchInterval: 10_000,
        ...options,
      }),


    useCreateMessage: (
      options?: UseMutationOptions<Message, Error, { conversationId: string; content: string }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ conversationId, content }) => client.messages.create(conversationId, { content }),
        onSuccess: (_, { conversationId }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.messages(conversationId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.conversations() });
          queryClient.invalidateQueries({ queryKey: queryKeys.conversation(conversationId) });
        },
        ...options,
      });
    },


    useQuickReplies: (
      options?: Omit<UseQueryOptions<QuickReply[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.quickReplies,
        queryFn: () => client.whatsapp.getQuickReplies(),
        ...options,
      }),

  };
}
