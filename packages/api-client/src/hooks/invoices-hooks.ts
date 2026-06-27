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


export function createInvoicesHooks(client: ApiClient) {
  return {
    useIssueInvoice: (
      options?: UseMutationOptions<InvoiceResponseDto, Error, IssueInvoiceDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.invoices.issue(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.invoices() }),
        ...options,
      });
    },


    useInvoices: (
      filters?: Record<string, string | number | undefined>,
      options?: Omit<UseQueryOptions<InvoiceResponseDto[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.invoices(filters),
        queryFn: () => client.invoices.findAll(filters as { status?: string; from?: string; to?: string; limit?: number; offset?: number }),
        ...options,
      }),


    useInvoice: (
      id: string,
      options?: Omit<UseQueryOptions<InvoiceResponseDto, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.invoice(id),
        queryFn: () => client.invoices.findOne(id),
        enabled: Boolean(id),
        ...options,
      }),


    useRetryInvoice: (
      options?: UseMutationOptions<InvoiceResponseDto, Error, string>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id) => client.invoices.retry(id),
        onSuccess: (_, id) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.invoices() });
          queryClient.invalidateQueries({ queryKey: queryKeys.invoice(id) });
        },
        ...options,
      });
    },


    useCreditNotes: (
      filters?: Record<string, string | number | undefined>,
      options?: Omit<UseQueryOptions<CreditNoteResponse[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.creditNotes(filters),
        queryFn: () => client.creditNotes.findAll(filters as { status?: string; from?: string; to?: string; limit?: number; offset?: number }),
        ...options,
      }),


    useCreditNote: (
      id: string,
      options?: Omit<UseQueryOptions<CreditNoteResponse, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.creditNote(id),
        queryFn: () => client.creditNotes.findOne(id),
        enabled: Boolean(id),
        ...options,
      }),


    useRetryCreditNote: (
      options?: UseMutationOptions<CreditNoteResponse, Error, string>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id) => client.creditNotes.retry(id),
        onSuccess: (_, id) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.creditNotes() });
          queryClient.invalidateQueries({ queryKey: queryKeys.creditNote(id) });
        },
        ...options,
      });
    },

  };
}
