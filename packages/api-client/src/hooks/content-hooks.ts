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


export function createContentHooks(client: ApiClient) {
  return {
    useProductContentDraft: (
      productId: string,
      options?: Omit<UseQueryOptions<ProductContentDraft | null, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.productContentDraft(productId),
        queryFn: () => client.ai.products.getDraft(productId),
        enabled: Boolean(productId),
        ...options,
      }),


    useGenerateProductContent: (
      options?: UseMutationOptions<ProductContentDraft, Error, string>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (productId) => client.ai.products.generateContent(productId),
        onSuccess: (_, productId) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.productContentDraft(productId) });
        },
        ...options,
      });
    },


    useApproveProductContent: (
      options?: UseMutationOptions<Product, Error, string>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (productId) => client.ai.products.approveDraft(productId),
        onSuccess: (_, productId) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.productContentDraft(productId) });
          queryClient.invalidateQueries({ queryKey: queryKeys.product(productId) });
        },
        ...options,
      });
    },


    useRejectProductContent: (
      options?: UseMutationOptions<{ success: boolean }, Error, string>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (productId) => client.ai.products.rejectDraft(productId),
        onSuccess: (_, productId) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.productContentDraft(productId) });
        },
        ...options,
      });
    },


    usePublishedFaqs: (
      options?: Omit<UseQueryOptions<Faq[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.faqs,
        queryFn: () => client.ai.faqs.findPublished(),
        ...options,
      }),


    useAdminFaqs: (
      options?: Omit<UseQueryOptions<Faq[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.adminFaqs,
        queryFn: () => client.ai.faqs.findAllAdmin(),
        ...options,
      }),


    useCreateFaq: (options?: UseMutationOptions<Faq, Error, CreateFaqDto>) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.ai.faqs.create(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.adminFaqs });
          queryClient.invalidateQueries({ queryKey: queryKeys.faqs });
        },
        ...options,
      });
    },


    useUpdateFaq: (
      options?: UseMutationOptions<Faq, Error, { id: string; data: UpdateFaqDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.ai.faqs.update(id, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.adminFaqs });
          queryClient.invalidateQueries({ queryKey: queryKeys.faqs });
        },
        ...options,
      });
    },


    useDeleteFaq: (options?: UseMutationOptions<{ success: boolean }, Error, string>) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id) => client.ai.faqs.remove(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.adminFaqs });
          queryClient.invalidateQueries({ queryKey: queryKeys.faqs });
        },
        ...options,
      });
    },


    useCmsPageBySlug: (
      slug: string,
      options?: Omit<UseQueryOptions<CmsPage, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.cmsPageBySlug(slug),
        queryFn: () => client.ai.cmsPages.findBySlug(slug),
        enabled: Boolean(slug),
        ...options,
      }),


    useAdminCmsPages: (
      options?: Omit<UseQueryOptions<CmsPage[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.adminCmsPages,
        queryFn: () => client.ai.cmsPages.findAllAdmin(),
        ...options,
      }),


    useCreateCmsPage: (options?: UseMutationOptions<CmsPage, Error, CreateCmsPageDto>) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.ai.cmsPages.create(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.adminCmsPages });
        },
        ...options,
      });
    },


    useUpdateCmsPage: (
      options?: UseMutationOptions<CmsPage, Error, { id: string; data: UpdateCmsPageDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.ai.cmsPages.update(id, data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.adminCmsPages });
        },
        ...options,
      });
    },


    useDeleteCmsPage: (
      options?: UseMutationOptions<{ success: boolean }, Error, string>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (id) => client.ai.cmsPages.remove(id),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.adminCmsPages });
        },
        ...options,
      });
    },

  };
}
