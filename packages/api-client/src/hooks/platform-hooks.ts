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


export function createPlatformHooks(client: ApiClient) {
  return {
    useCompanies: (options?: Omit<UseQueryOptions<Company[], Error>, 'queryKey' | 'queryFn'>) =>
      useQuery({
        queryKey: queryKeys.companies,
        queryFn: () => client.b2b.listCompanies(),
        ...options,
      }),


    useMyCompany: (
      options?: Omit<
        UseQueryOptions<{ company: Company; role: string } | null, Error>,
        'queryKey' | 'queryFn'
      >,
    ) =>
      useQuery({
        queryKey: queryKeys.myCompany,
        queryFn: () => client.b2b.myCompany(),
        ...options,
      }),


    useQuotes: (
      scope: 'me' | 'admin' = 'me',
      status?: string,
      options?: Omit<UseQueryOptions<Quote[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.quotes(scope, status),
        queryFn: () => (scope === 'admin' ? client.quotes.adminList(status) : client.quotes.mine()),
        ...options,
      }),


    useQuote: (
      id: string,
      options?: Omit<UseQueryOptions<Quote, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.quote(id),
        queryFn: () => client.quotes.findOne(id),
        enabled: Boolean(id),
        ...options,
      }),


    useMarketplaceChannels: (
      options?: Omit<UseQueryOptions<MarketplaceChannelProfile[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.marketplaceChannels,
        queryFn: () => client.marketplace.channels(),
        ...options,
      }),


    useMarketplaceListings: (
      channel?: string,
      options?: Omit<UseQueryOptions<MarketplaceListing[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.marketplaceListings(channel),
        queryFn: () => client.marketplace.listings(channel),
        ...options,
      }),


    useAccountingProviders: (
      options?: Omit<UseQueryOptions<AccountingProviderProfile[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.accountingProviders,
        queryFn: () => client.accounting.providers(),
        ...options,
      }),


    useAccountingSyncRecords: (
      options?: Omit<UseQueryOptions<AccountingSyncRecord[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.accountingSyncRecords,
        queryFn: () => client.accounting.syncRecords(),
        ...options,
      }),


    useCreateCompany: (
      options?: UseMutationOptions<Company, Error, CreateCompanyDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.b2b.createCompany(data),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.companies }),
        ...options,
      });
    },


    useUpdateQuoteStatus: (
      options?: UseMutationOptions<Quote, Error, { id: string; data: UpdateQuoteStatusDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.quotes.updateStatus(id, data),
        onSuccess: (_, { id }) => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.quotesRoot });
          void queryClient.invalidateQueries({ queryKey: queryKeys.quote(id) });
        },
        ...options,
      });
    },


    useConvertQuote: (
      options?: UseMutationOptions<ConvertQuoteResult, Error, string>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id) => client.quotes.convert(id),
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.quotesRoot });
          void queryClient.invalidateQueries({ queryKey: queryKeys.ordersRoot });
        },
        ...options,
      });
    },


    useSyncMarketplaceProduct: (
      options?: UseMutationOptions<MarketplaceListing, Error, { productId: string; channel?: string }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ productId, channel }) => client.marketplace.syncProduct(productId, channel),
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: queryKeys.marketplaceListingsRoot }),
        ...options,
      });
    },


    useImportMarketplaceOrder: (
      options?: UseMutationOptions<unknown, Error, MarketplaceImportOrderDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.marketplace.importOrder(data),
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.marketplaceListingsRoot });
          void queryClient.invalidateQueries({ queryKey: queryKeys.ordersRoot });
        },
        ...options,
      });
    },


    useSyncAccountingInvoice: (
      options?: UseMutationOptions<void, Error, string>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (invoiceId) => client.accounting.syncInvoice(invoiceId),
        onSuccess: () =>
          void queryClient.invalidateQueries({ queryKey: queryKeys.accountingSyncRecords }),
        ...options,
      });
    },


    useMarketplaceFeeReconciliations: (
      options?: Omit<UseQueryOptions<MarketplaceFeeReconciliation[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.marketplaceFeeReconciliations,
        queryFn: () => client.accounting.marketplaceFees(),
        ...options,
      }),


    useSyncMarketplaceFee: (
      options?: UseMutationOptions<void, Error, string>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (orderId) => client.accounting.syncMarketplaceFee(orderId),
        onSuccess: () => {
          void queryClient.invalidateQueries({ queryKey: queryKeys.marketplaceFeeReconciliations });
          void queryClient.invalidateQueries({ queryKey: queryKeys.accountingSyncRecords });
        },
        ...options,
      });
    },


    usePrivacyExport: (
      options?: Omit<UseQueryOptions<PrivacyExportBundle, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.privacyExport,
        queryFn: () => client.privacy.exportMine(),
        enabled: false,
        ...options,
      }),


    usePrivacyDelete: (
      options?: UseMutationOptions<PrivacyDeletionResult, Error, void>,
    ) => useMutation({ mutationFn: () => client.privacy.deleteMine(), ...options }),


    useCcpaOptOut: (
      options?: UseMutationOptions<CcpaOptOutResult, Error, boolean>,
    ) => useMutation({ mutationFn: (optOut) => client.privacy.ccpaOptOut(optOut), ...options }),
  };
}
