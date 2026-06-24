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
  SearchResultItem,
  Faq,
  ProductContentDraft,
  ChatSession,
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
  ExternalReviewSummary,
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
import type { ApiClient } from './client.js';

export const queryKeys = {
  categories: ['categories'] as const,
  category: (id: string) => ['categories', id] as const,
  products: (filters?: Record<string, string | undefined>) => ['products', filters ?? {}] as const,
  product: (id: string) => ['products', id] as const,
  productBySlug: (slug: string) => ['products', 'slug', slug] as const,
  orders: (filters?: Record<string, string | number | undefined>) => ['orders', filters ?? {}] as const,
  order: (id: string) => ['orders', id] as const,
  cart: (id: string) => ['cart', id] as const,
  users: ['users'] as const,
  user: (id: string) => ['users', id] as const,
  suppliers: ['suppliers'] as const,
  supplier: (id: string) => ['suppliers', id] as const,
  inventory: ['inventory'] as const,
  inventoryItem: (id: string) => ['inventory', id] as const,
  me: ['auth', 'me'] as const,
  returns: (filters?: Record<string, string | number | undefined>) => ['returns', filters ?? {}] as const,
  return: (id: string) => ['returns', id] as const,
  storeCredit: ['returns', 'store-credit'] as const,
  conversations: (filters?: Record<string, string | undefined>) => ['conversations', filters ?? {}] as const,
  conversation: (id: string) => ['conversations', id] as const,
  messages: (conversationId: string) => ['conversations', conversationId, 'messages'] as const,
  quickReplies: ['whatsapp', 'quick-replies'] as const,
  invoices: (filters?: Record<string, string | number | undefined>) => ['invoices', filters ?? {}] as const,
  invoice: (id: string) => ['invoices', id] as const,
  creditNotes: (filters?: Record<string, string | number | undefined>) => ['credit-notes', filters ?? {}] as const,
  creditNote: (id: string) => ['credit-notes', id] as const,
  notificationPreferences: ['notifications', 'preferences'] as const,
  search: (query: string) => ['search', query] as const,
  catalog: (filters?: Record<string, string | number | boolean | undefined>) =>
    ['catalog', filters ?? {}] as const,
  chatMessages: (sessionId: string) => ['chat', sessionId, 'messages'] as const,
  productContentDraft: (productId: string) => ['ai', 'products', productId, 'draft'] as const,
  faqs: ['ai', 'faqs'] as const,
  productReviews: (productId: string) => ['reviews', productId] as const,
  productReviewSummary: (productId: string) => ['reviews', productId, 'summary'] as const,
  pendingReviews: ['reviews', 'pending'] as const,
  loyaltyAccount: ['loyalty', 'me'] as const,
  loyaltyTransactions: ['loyalty', 'transactions'] as const,
  referralCode: ['referrals', 'code'] as const,
  referralPerformance: (scope: 'me' | 'admin') => ['referrals', 'performance', scope] as const,
  companies: ['b2b', 'companies'] as const,
  myCompany: ['b2b', 'me', 'company'] as const,
  companyPrices: (companyId: string) => ['b2b', 'companies', companyId, 'prices'] as const,
  quotes: (scope: 'me' | 'admin', status?: string) => ['quotes', scope, status ?? 'all'] as const,
  quote: (id: string) => ['quotes', id] as const,
  marketplaceChannels: ['marketplace', 'channels'] as const,
  marketplaceListings: (channel?: string) => ['marketplace', 'listings', channel ?? 'all'] as const,
  accountingProviders: ['accounting', 'providers'] as const,
  accountingSyncRecords: ['accounting', 'sync-records'] as const,
  marketplaceFeeReconciliations: ['accounting', 'marketplace-fees'] as const,
  privacyExport: ['privacy', 'export'] as const,
};

export function createQueryHooks(client: ApiClient) {
  return {
    useMe: (options?: Omit<UseQueryOptions<User, Error>, 'queryKey' | 'queryFn'>) =>
      useQuery({
        queryKey: queryKeys.me,
        queryFn: () => client.auth.getMe(),
        ...options,
      }),

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

    useOrders: (
      filters?: Record<string, string | number | undefined>,
      options?: Omit<UseQueryOptions<PaginatedResponse<Order>, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.orders(filters),
        queryFn: () => client.orders.findAll(filters),
        ...options,
      }),

    useOrder: (
      id: string,
      options?: Omit<UseQueryOptions<Order, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.order(id),
        queryFn: () => client.orders.findOne(id),
        enabled: Boolean(id),
        ...options,
      }),

    useCreateOrder: (
      options?: UseMutationOptions<CreatedOrderResult, Error, CreateOrderDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.orders.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.orders() }),
        ...options,
      });
    },

    useUpdateOrderStatus: (
      options?: UseMutationOptions<Order, Error, { id: string; data: UpdateOrderStatusDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.orders.updateStatus(id, data),
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
          queryClient.invalidateQueries({ queryKey: queryKeys.order(id) });
        },
        ...options,
      });
    },

    useCreatePaymentIntent: (
      options?: UseMutationOptions<PaymentIntentResult, Error, CreatePaymentIntentDto>,
    ) => useMutation({ mutationFn: (data) => client.payments.createIntent(data), ...options }),

    useCart: (
      id: string,
      options?: Omit<UseQueryOptions<Cart, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.cart(id),
        queryFn: () => client.cart.findOne(id),
        enabled: Boolean(id),
        ...options,
      }),

    useAddCartItem: (
      options?: UseMutationOptions<Cart, Error, { cartId: string; data: AddCartItemDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ cartId, data }) => client.cart.addItem(data),
        onSuccess: (_, { cartId }) => queryClient.invalidateQueries({ queryKey: queryKeys.cart(cartId) }),
        ...options,
      });
    },

    useUpdateCartItem: (
      options?: UseMutationOptions<Cart, Error, { cartId: string; id: string; data: UpdateCartItemDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.cart.updateItem(id, data),
        onSuccess: (_, { cartId }) => queryClient.invalidateQueries({ queryKey: queryKeys.cart(cartId) }),
        ...options,
      });
    },

    useRemoveCartItem: (
      options?: UseMutationOptions<Cart, Error, { cartId: string; id: string }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id }) => client.cart.removeItem(id),
        onSuccess: (_, { cartId }) => queryClient.invalidateQueries({ queryKey: queryKeys.cart(cartId) }),
        ...options,
      });
    },

    useUsers: (options?: Omit<UseQueryOptions<User[], Error>, 'queryKey' | 'queryFn'>) =>
      useQuery({
        queryKey: queryKeys.users,
        queryFn: () => client.users.findAll(),
        ...options,
      }),

    useSuppliers: (
      options?: Omit<UseQueryOptions<Supplier[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.suppliers,
        queryFn: () => client.suppliers.findAll(),
        ...options,
      }),

    useCreateSupplier: (
      options?: UseMutationOptions<Supplier, Error, CreateSupplierDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.suppliers.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.suppliers }),
        ...options,
      });
    },

    useUpdateSupplier: (
      options?: UseMutationOptions<Supplier, Error, { id: string; data: UpdateSupplierDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.suppliers.update(id, data),
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.suppliers });
          queryClient.invalidateQueries({ queryKey: queryKeys.supplier(id) });
        },
        ...options,
      });
    },

    useInventory: (
      options?: Omit<UseQueryOptions<Inventory[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.inventory,
        queryFn: () => client.inventory.findAll(),
        ...options,
      }),

    useCreateInventory: (
      options?: UseMutationOptions<Inventory, Error, CreateInventoryDto>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (data) => client.inventory.create(data),
        onSuccess: () => queryClient.invalidateQueries({ queryKey: queryKeys.inventory }),
        ...options,
      });
    },

    useUpdateInventory: (
      options?: UseMutationOptions<Inventory, Error, { id: string; data: UpdateInventoryDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ id, data }) => client.inventory.update(id, data),
        onSuccess: (_, { id }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.inventory });
          queryClient.invalidateQueries({ queryKey: queryKeys.inventoryItem(id) });
        },
        ...options,
      });
    },

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

    useCreateRefund: (
      options?: UseMutationOptions<Refund, Error, { orderId: string; data: CreateRefundDto }>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: ({ orderId, data }) => client.orders.createRefund(orderId, data),
        onSuccess: (_, { orderId }) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.orders() });
          queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
          queryClient.invalidateQueries({ queryKey: ['orders', orderId, 'refunds'] });
        },
        ...options,
      });
    },

    useListRefunds: (
      orderId: string,
      options?: Omit<UseQueryOptions<Refund[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: ['orders', orderId, 'refunds'],
        queryFn: () => client.orders.listRefunds(orderId),
        enabled: Boolean(orderId),
        ...options,
      }),

    useGenerateReceipt: (
      options?: UseMutationOptions<ReceiptResponse, Error, string>,
    ) => {
      const queryClient = useQueryClient();
      return useMutation({
        mutationFn: (orderId) => client.orders.generateReceipt(orderId),
        onSuccess: (_, orderId) => {
          queryClient.invalidateQueries({ queryKey: queryKeys.order(orderId) });
        },
        ...options,
      });
    },

    useGetReceipt: (
      orderId: string,
      options?: Omit<UseQueryOptions<ReceiptResponse, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: ['orders', orderId, 'receipt'],
        queryFn: () => client.orders.getReceipt(orderId),
        enabled: Boolean(orderId),
        ...options,
      }),

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

    useLoyaltyAccount: (
      options?: Omit<UseQueryOptions<LoyaltyAccount, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.loyaltyAccount,
        queryFn: () => client.loyalty.me(),
        ...options,
      }),

    useLoyaltyTransactions: (
      options?: Omit<UseQueryOptions<LoyaltyTransaction[], Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.loyaltyTransactions,
        queryFn: () => client.loyalty.transactions(),
        ...options,
      }),

    useLoyaltyRedemptionQuote: (
      subtotal: number,
      points?: number,
      options?: Omit<UseQueryOptions<LoyaltyRedemptionQuote, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: ['loyalty', 'quote', subtotal, points] as const,
        queryFn: () => client.loyalty.quoteRedemption(subtotal, points),
        enabled: subtotal > 0,
        ...options,
      }),

    useReferralCode: (
      options?: Omit<UseQueryOptions<ReferralCode, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.referralCode,
        queryFn: () => client.referrals.myCode(),
        ...options,
      }),

    useReferralPerformance: (
      scope: 'me' | 'admin' = 'me',
      options?: Omit<UseQueryOptions<ReferralPerformanceReport, Error>, 'queryKey' | 'queryFn'>,
    ) =>
      useQuery({
        queryKey: queryKeys.referralPerformance(scope),
        queryFn: () =>
          scope === 'admin' ? client.referrals.adminPerformance() : client.referrals.myPerformance(),
        ...options,
      }),

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
          void queryClient.invalidateQueries({ queryKey: ['quotes'] });
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
          void queryClient.invalidateQueries({ queryKey: ['quotes'] });
          void queryClient.invalidateQueries({ queryKey: ['orders'] });
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
        onSuccess: () => void queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] }),
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
          void queryClient.invalidateQueries({ queryKey: ['marketplace', 'listings'] });
          void queryClient.invalidateQueries({ queryKey: ['orders'] });
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

export type ApiQueryHooks = ReturnType<typeof createQueryHooks>;
