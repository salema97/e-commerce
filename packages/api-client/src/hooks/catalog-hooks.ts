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


export function createCatalogHooks(client: ApiClient) {
  return {
    useCategories: (options?: Omit<UseQueryOptions<Category[], Error>, 'queryKey' | 'queryFn'>) =>
      useQuery({
        queryKey: queryKeys.categories,
        queryFn: () => client.categories.findAll(),
        ...options,
      }),


    useCategory: (
      id: string,
      options?: Omit<UseQueryOptions<Category, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.category(id),
        queryFn: () => client.categories.findOne(id),
        enabled: Boolean(id),
        ...options,
      }),


    useCreateCategory: (
      options?: UseMutationOptions<Category, Error, CreateCategoryDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.categories.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.categories }),
        ...options,
      });
    },


    useUpdateCategory: (
      options?: UseMutationOptions<Category, Error, { id: string; data: UpdateCategoryDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.categories.update(id, data),
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.categories });
          queryClient.invalidateQueries({ queryKey: queryKeys.category(id) });
        },
        ...options,
      });
    },


    useProducts: (
      filters?: Record<string, string | undefined>,
      options?: Omit<UseQueryOptions<Product[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.products(filters),
        queryFn: () => client.products.findAll(filters),
        ...options,
      }),


    useProduct: (
      id: string,
      options?: Omit<UseQueryOptions<Product, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.product(id),
        queryFn: () => client.products.findOne(id),
        enabled: Boolean(id),
        ...options,
      }),


    useProductBySlug: (
      slug: string,
      options?: Omit<UseQueryOptions<Product, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.productBySlug(slug),
        queryFn: () => client.products.findBySlug(slug),
        enabled: Boolean(slug),
        ...options,
      }),


    useCreateProduct: (
      options?: UseMutationOptions<Product, Error, CreateProductDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.products.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.products() }),
        ...options,
      });
    },


    useUpdateProduct: (
      options?: UseMutationOptions<Product, Error, { id: string; data: UpdateProductDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.products.update(id, data),
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.products() });
          queryClient.invalidateQueries({ queryKey: queryKeys.product(id) });
        },
        ...options,
      });
    },

  };
}
