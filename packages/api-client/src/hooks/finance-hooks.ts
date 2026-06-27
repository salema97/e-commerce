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


export function createFinanceHooks(client: ApiClient) {
  return {
    useFinanceIncomes: (
      filters?: Record<string, string | number | undefined>,
      options?: Omit<UseQueryOptions<Income[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.financeIncomes(filters),
        queryFn: () => client.finance.incomes.findAll(filters),
        ...options,
      }),


    useCreateFinanceIncome: (
      options?: UseMutationOptions<Income, Error, CreateIncomeDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.finance.incomes.create(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.financeIncomes() });
        },
        ...options,
      });
    },


    useNotificationPreferences: (
      options?: Omit<
        UseQueryOptions<
          { emailOptOut: boolean; marketingEmailOptOut: boolean; whatsappOptOut: boolean },
          Error
        >,
        'queryKey' | 'queryFn'
      >,
    ) =>
      useQuery({
        queryKey: queryKeys.notificationPreferences,
        queryFn: () => client.notifications.preferences.get(),
        ...options,
      }),


    useUpdateNotificationPreferences: (
      options?: UseMutationOptions<
        { emailOptOut: boolean; marketingEmailOptOut: boolean; whatsappOptOut: boolean },
        Error,
        {
          emailOptOut?: boolean;
          marketingEmailOptOut?: boolean;
          whatsappOptOut?: boolean;
        }
      >,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.notifications.preferences.update(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.notificationPreferences });
        },
        ...options,
      });
    },


    useFinanceExpenseCategories: (
      options?: Omit<UseQueryOptions<ExpenseCategory[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.financeExpenseCategories,
        queryFn: () => client.finance.expenseCategories.findAll(),
        ...options,
      }),


    useCreateFinanceExpenseCategory: (
      options?: UseMutationOptions<ExpenseCategory, Error, CreateExpenseCategoryDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.finance.expenseCategories.create(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.financeExpenseCategories });
        },
        ...options,
      });
    },


    useFinanceExpenses: (
      filters?: Record<string, string | number | undefined>,
      options?: Omit<UseQueryOptions<Expense[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.financeExpenses(filters),
        queryFn: () => client.finance.expenses.findAll(filters),
        ...options,
      }),


    useCreateFinanceExpense: (
      options?: UseMutationOptions<Expense, Error, CreateExpenseDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.finance.expenses.create(data),
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: queryKeys.financeExpenses() });
        },
        ...options,
      });
    },


    useFinanceCashFlow: (
      from: string,
      to: string,
      options?: Omit<UseQueryOptions<CashFlowReport, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.financeCashFlow(from, to),
        queryFn: () => client.finance.reports.cashFlow(from, to),
        enabled: Boolean(from && to),
        ...options,
      }),


    useFinanceStoreCredits: (
      options?: Omit<UseQueryOptions<AdminStoreCredit[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.financeStoreCredits,
        queryFn: () => client.finance.storeCredits.findAll(),
        ...options,
      }),


    useSubscribeBackInStock: (
      options?: UseMutationOptions<
        { id: string; productId: string; email: string },
        Error,
        { productId: string; email: string }
      >,
    ) =>
      useMutation({
        mutationFn: ({ productId, email }) =>
          client.products.subscribeBackInStock(productId, { email }),
        ...options,
      }),

  };
}
