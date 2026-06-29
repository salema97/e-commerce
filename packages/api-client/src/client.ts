import type {
  Category,
  CreateCategoryDto,
  UpdateCategoryDto,
  Product,
  CreateProductDto,
  UpdateProductDto,
  Inventory,
  CreateInventoryDto,
  UpdateInventoryDto,
  ReserveInventoryDto,
  Supplier,
  CreateSupplierDto,
  UpdateSupplierDto,
  User,
  CreateUserDto,
  UpdateUserDto,
  Order,
  CreateOrderDto,
  CreatedOrderResult,
  UpdateOrderStatusDto,
  CreatePaymentIntentDto,
  PaymentIntentResult,
  InvoiceResponseDto,
  IssueInvoiceDto,
  CreditNoteResponse,
  AddCartItemDto,
  UpdateCartItemDto,
  Cart,
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
  AuthResponse,
  LoginDto,
  RegisterDto,
  AuthUser,
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
  IssueStoreCreditDto,
  UpdateStoreCreditDto,
  GiftCard,
  CreateGiftCardDto,
  UpdateGiftCardDto,
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
  Coupon,
  DiscountRule,
  CreatePromotionDto,
  UpdatePromotionDto,
  CreateAdminCouponDto,
  UpdateCouponDto,
  CreateDiscountRuleDto,
  UpdateDiscountRuleDto,
  AdminPromotionsQuery,
  DistributePromoDto,
  DistributePromoResponse,
  MarketingPlacement,
  CreateMarketingPlacementDto,
  UpdateMarketingPlacementDto,
  ActivePlacementsResponse,
  ActiveMarketingPlatform,
  AdminMarketingPlacementsQuery,
  AnalyticsOverviewReport,
  CohortRetentionReport,
  ShippingQuote,
  ShippingQuoteDto,
  ShippingZone,
  Shipment,
  AdminShipmentListItem,
  BackorderLine,
  BulkImportResult,
  CreateShipmentDto,
  OrderTracking,
  WmsTrackingEvent,
  WmsSyncResult,
  WmsProviderProfile,
  WmsInventoryRecord,
  UpdateReturnShippingDto,
  CatalogResponse,
  CatalogQuery,
  ProductReview,
  ProductReviewSummary,
  CreateProductReviewDto,
  UpdateReviewStatusDto,
  ExternalReviewSummary,
  LoyaltyAccount,
  LoyaltyTransaction,
  LoyaltyRedemptionQuote,
  ReferralCode,
  ReferralConversion,
  ReferralPerformanceReport,
  PayoutReferralDto,
  Company,
  CompanyUser,
  CompanyPriceListItem,
  CreateCompanyDto,
  UpdateCompanyDto,
  UpsertCompanyPriceDto,
  BulkOrderImportResult,
  Quote,
  CreateQuoteDto,
  UpdateQuoteStatusDto,
  ConvertQuoteResult,
  MarketplaceChannelProfile,
  MarketplaceListing,
  MarketplaceImportOrderDto,
  MarketplaceOrderImport,
  AccountingProviderProfile,
  AccountingSyncRecord,
  MarketplaceFeeReconciliation,
  PrivacyExportBundle,
  PrivacyDeletionResult,
  CcpaOptOutResult,
  StoreLocation,
  CreateStoreLocationDto,
  PosRegister,
  CreatePosRegisterDto,
  CreatePosOrderDto,
  SubscriptionPlan,
  CreateSubscriptionPlanDto,
  CustomerSubscription,
  Seller,
  CreateSellerDto,
  UpdateSellerDto,
  SellerPayout,
} from '@repo/shared-types';

export interface ApiClientOptions {
  baseURL: string;
  getToken?: () => string | null | Promise<string | null>;
  onError?: (error: ApiClientError) => void;
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
  /** Called once on 401; return true to retry the request (e.g. after cookie refresh). */
  onUnauthorized?: () => Promise<boolean>;
}

export class ApiClientError extends Error {
  constructor(
    message: string,
    public readonly statusCode: number,
    public readonly response?: Record<string, unknown>,
  ) {
    super(message);
    this.name = 'ApiClientError';
  }
}

async function parseResponse(response: Response): Promise<unknown> {
  const contentType = response.headers.get('content-type') ?? '';

  if (contentType.includes('application/json')) {
    return response.json();
  }

  return response.text();
}

function buildURL(baseURL: string, path: string, query?: Record<string, string | number | boolean | undefined>): string {
  const normalizedBase = baseURL.endsWith('/') ? baseURL : `${baseURL}/`;
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path;
  const url = new URL(normalizedPath, normalizedBase);

  if (query) {
    for (const [key, value] of Object.entries(query)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}

export function createApiClient(options: ApiClientOptions) {
  const { baseURL, getToken, onError, getHeaders, onUnauthorized } = options;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>,
    isRetry = false,
  ): Promise<T> {
    const token = getToken ? await getToken() : null;
    const extraHeaders = getHeaders ? await getHeaders() : {};
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      ...extraHeaders,
    };

    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }

    const response = await fetch(buildURL(baseURL, path, query), {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });

    if (!response.ok) {
      if (response.status === 401 && onUnauthorized && !isRetry) {
        const recovered = await onUnauthorized();
        if (recovered) {
          return request<T>(method, path, body, query, true);
        }
      }

      const data = await parseResponse(response);
      const error = new ApiClientError(
        typeof data === 'object' && data !== null && 'message' in data
          ? String(data.message)
          : `HTTP ${response.status} error`,
        response.status,
        typeof data === 'object' ? (data as Record<string, unknown>) : undefined,
      );
      onError?.(error);
      throw error;
    }

    if (response.status === 204) {
      return undefined as T;
    }

    return parseResponse(response) as Promise<T>;
  }

  return {
    auth: {
      login: (data: LoginDto) => request<AuthResponse>('POST', '/auth/login', data),
      register: (data: RegisterDto) => request<AuthResponse>('POST', '/auth/register', data),
      logout: (refreshToken?: string) =>
        request<{ ok: boolean }>('POST', '/auth/logout', refreshToken ? { refreshToken } : undefined),
      refresh: (refreshToken: string) =>
        request<AuthResponse['tokens']>('POST', '/auth/refresh', { refreshToken }),
      getMe: () => request<AuthUser>('GET', '/auth/me'),
    },
    users: {
      findAll: () => request<User[]>('GET', '/users'),
      findOne: (id: string) => request<User>('GET', `/users/${id}`),
      create: (data: CreateUserDto) => request<User>('POST', '/users', data),
      update: (id: string, data: UpdateUserDto) => request<User>('PATCH', `/users/${id}`, data),
      remove: (id: string) => request<User>('DELETE', `/users/${id}`),
    },
    categories: {
      findAll: () => request<Category[]>('GET', '/categories'),
      findOne: (id: string) => request<Category>('GET', `/categories/${id}`),
      create: (data: CreateCategoryDto) => request<Category>('POST', '/categories', data),
      update: (id: string, data: UpdateCategoryDto) => request<Category>('PATCH', `/categories/${id}`, data),
      remove: (id: string) => request<Category>('DELETE', `/categories/${id}`),
    },
    products: {
      findAll: (query?: { categoryId?: string; status?: string }) =>
        request<Product[]>('GET', '/products', undefined, query),
      findStore: (query?: {
        category?: string;
        sort?: string;
        page?: number;
        limit?: number;
      }) =>
        request<{ items: Product[]; total: number; page: number; limit: number }>(
          'GET',
          '/products/store',
          undefined,
          query,
        ),
      findOne: (id: string) => request<Product>('GET', `/products/${id}`),
      findBySlug: (slug: string) => request<Product>('GET', `/products/slug/${slug}`),
      create: (data: CreateProductDto) => request<Product>('POST', '/products', data),
      update: (id: string, data: UpdateProductDto) => request<Product>('PATCH', `/products/${id}`, data),
      remove: (id: string) => request<Product>('DELETE', `/products/${id}`),
      subscribeBackInStock: (productId: string, data: { email: string }) =>
        request<{ id: string; productId: string; email: string }>(
          'POST',
          `/products/${productId}/back-in-stock-alerts`,
          data,
        ),
    },
    inventory: {
      findAll: () => request<Inventory[]>('GET', '/inventory'),
      findOne: (id: string) => request<Inventory>('GET', `/inventory/${id}`),
      create: (data: CreateInventoryDto) => request<Inventory>('POST', '/inventory', data),
      update: (id: string, data: UpdateInventoryDto) => request<Inventory>('PATCH', `/inventory/${id}`, data),
      reserve: (id: string, data: ReserveInventoryDto) => request<Inventory>('POST', `/inventory/${id}/reserve`, data),
    },
    suppliers: {
      findAll: () => request<Supplier[]>('GET', '/suppliers'),
      findOne: (id: string) => request<Supplier>('GET', `/suppliers/${id}`),
      create: (data: CreateSupplierDto) => request<Supplier>('POST', '/suppliers', data),
      update: (id: string, data: UpdateSupplierDto) => request<Supplier>('PATCH', `/suppliers/${id}`, data),
      remove: (id: string) => request<Supplier>('DELETE', `/suppliers/${id}`),
    },
    orders: {
      findAll: (query?: { page?: number; limit?: number; status?: string }) =>
        request<PaginatedResponse<Order>>('GET', '/orders', undefined, query),
      findOne: (id: string, query?: { guestEmail?: string }) =>
        request<Order>('GET', `/orders/${id}`, undefined, query),
      create: (data: CreateOrderDto) => request<CreatedOrderResult>('POST', '/orders', data),
      updateStatus: (id: string, data: UpdateOrderStatusDto) =>
        request<Order>('PATCH', `/orders/${id}/status`, data),
      createPaymentIntent: (id: string, data: CreatePaymentIntentDto) => request<PaymentIntentResult>('POST', `/orders/${id}/payment-intent`, data),
      listRefunds: (id: string) => request<Refund[]>('GET', `/orders/${id}/refunds`),
      createRefund: (id: string, data: CreateRefundDto) => request<Refund>('POST', `/orders/${id}/refunds`, data),
      generateReceipt: (id: string) => request<ReceiptResponse>('POST', `/orders/${id}/receipt`),
      getReceipt: (id: string) => request<ReceiptResponse>('GET', `/orders/${id}/receipt`),
      getTracking: (id: string) => request<OrderTracking>('GET', `/orders/${id}/tracking`),
    },
    shipping: {
      quote: (data: ShippingQuoteDto) => request<ShippingQuote>('POST', '/shipping/quote', data),
      listZones: () => request<ShippingZone[]>('GET', '/shipping/zones'),
    },
    fulfillment: {
      createShipment: (orderId: string, data: CreateShipmentDto) =>
        request<Shipment>('POST', `/fulfillment/orders/${orderId}/shipments`, data),
      listShipments: (orderId: string) =>
        request<Shipment[]>('GET', `/fulfillment/orders/${orderId}/shipments`),
      listAllShipments: (params?: { status?: string; limit?: number; offset?: number }) => {
        const search = new URLSearchParams();
        if (params?.status) search.set('status', params.status);
        if (params?.limit != null) search.set('limit', String(params.limit));
        if (params?.offset != null) search.set('offset', String(params.offset));
        const query = search.toString();
        return request<AdminShipmentListItem[]>(
          'GET',
          `/fulfillment/shipments${query ? `?${query}` : ''}`,
        );
      },
      markDelivered: (shipmentId: string) =>
        request<Shipment>('PATCH', `/fulfillment/shipments/${shipmentId}/delivered`),
      getLabelUrl: (shipmentId: string) =>
        `/fulfillment/shipments/${shipmentId}/label`,
      getTracking: (orderId: string) =>
        request<Shipment[]>('GET', `/fulfillment/orders/${orderId}/tracking`),
      listWmsProviders: () => request<WmsProviderProfile[]>('GET', '/fulfillment/wms/providers'),
      syncWmsInventory: (records: WmsInventoryRecord[]) =>
        request<WmsSyncResult>('POST', '/fulfillment/wms/sync-inventory', { records }),
      importWmsTracking: (events: WmsTrackingEvent[]) =>
        request<{ imported: number }>('POST', '/fulfillment/wms/import-tracking', { events }),
      listBackorders: () => request<BackorderLine[]>('GET', '/fulfillment/backorders'),
    },
    bulkImport: {
      importProducts: (csv: string) =>
        request<BulkImportResult>('POST', '/bulk-import/products', { csv }),
    },
    payments: {
      createIntent: (data: CreatePaymentIntentDto) => request<PaymentIntentResult>('POST', '/payments/intent', data),
    },
    refunds: {
      approve: (id: string) => request<Refund>('PATCH', `/refunds/${id}/approve`),
    },
    invoices: {
      issue: (data: IssueInvoiceDto) => request<InvoiceResponseDto>('POST', '/invoices', data),
      issueCreditNote: (data: { returnRequestId: string; total?: string }) =>
        request<InvoiceResponseDto>('POST', '/invoices/credit-notes', data),
      findAll: (query?: {
        orderId?: string;
        status?: string;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
      }) => request<InvoiceResponseDto[]>('GET', '/invoices', undefined, query),
      findOne: (id: string) => request<InvoiceResponseDto>('GET', `/invoices/${id}`),
      retry: (id: string) => request<InvoiceResponseDto>('POST', `/invoices/${id}/retry`),
      downloadXml: (id: string) => `${baseURL}/invoices/${id}/xml`,
      downloadPdf: (id: string) => `${baseURL}/invoices/${id}/pdf`,
    },
    creditNotes: {
      findAll: (query?: {
        returnRequestId?: string;
        status?: string;
        from?: string;
        to?: string;
        limit?: number;
        offset?: number;
      }) => request<CreditNoteResponse[]>('GET', '/credit-notes', undefined, query),
      findOne: (id: string) => request<CreditNoteResponse>('GET', `/credit-notes/${id}`),
      retry: (id: string) => request<CreditNoteResponse>('POST', `/credit-notes/${id}/retry`),
      downloadXml: (id: string) => `${baseURL}/credit-notes/${id}/xml`,
      downloadPdf: (id: string) => `${baseURL}/credit-notes/${id}/pdf`,
    },
    returns: {
      findAll: (query?: { status?: string; orderId?: string; userId?: string; customerEmail?: string; limit?: number; offset?: number }) =>
        request<ReturnRequest[]>('GET', '/returns', undefined, query),
      findOne: (id: string) => request<ReturnRequest>('GET', `/returns/${id}`),
      createForOrder: (orderId: string, data: CreateReturnRequestDto) =>
        request<ReturnRequest>('POST', `/orders/${orderId}/returns`, data),
      createGuest: (data: CreateGuestReturnRequestDto) =>
        request<ReturnRequest>('POST', '/returns/guest/request', data),
      updateStatus: (id: string, data: UpdateReturnStatusDto) =>
        request<ReturnRequest>('PATCH', `/returns/${id}/status`, data),
      resolve: (id: string, data: ResolveReturnDto) =>
        request<ReturnRequest>('POST', `/returns/${id}/resolve`, data),
      updateShipping: (id: string, data: UpdateReturnShippingDto) =>
        request<ReturnRequest>('PATCH', `/returns/${id}/shipping`, data),
      myStoreCredit: () => request<StoreCreditBalance>('GET', '/returns/store-credit/me'),
    },
    cart: {
      findOne: (id: string) => request<Cart>('GET', `/cart/${id}`),
      addItem: (data: AddCartItemDto) => request<Cart>('POST', '/cart/items', data),
      updateItem: (id: string, data: UpdateCartItemDto) => request<Cart>('PATCH', `/cart/items/${id}`, data),
      removeItem: (id: string) => request<Cart>('DELETE', `/cart/items/${id}`),
    },
    conversations: {
      findAll: (query?: { status?: string; assignedToMe?: string; search?: string; page?: number; limit?: number }) => request<PaginatedConversations>('GET', '/conversations', undefined, query),
      findOne: (id: string) => request<Conversation>('GET', `/conversations/${id}`),
      update: (id: string, data: { status?: string; assignedAgentId?: string; internalNotes?: string }) => request<Conversation>('PATCH', `/conversations/${id}`, data),
    },
    messages: {
      findAll: (conversationId: string, query?: { page?: number; limit?: number }) => request<PaginatedMessages>('GET', `/conversations/${conversationId}/messages`, undefined, query),
      create: (conversationId: string, data: { content: string }) => request<Message>('POST', `/conversations/${conversationId}/messages`, data),
    },
    whatsapp: {
      getQuickReplies: () => request<QuickReply[]>('GET', '/whatsapp/quick-replies'),
      listQuickRepliesAdmin: () => request<QuickReply[]>('GET', '/whatsapp/quick-replies/admin'),
      createQuickReply: (data: { label: string; text: string; sortOrder?: number; isActive?: boolean }) =>
        request<QuickReply>('POST', '/whatsapp/quick-replies', data),
      updateQuickReply: (
        id: string,
        data: { label?: string; text?: string; sortOrder?: number; isActive?: boolean },
      ) => request<QuickReply>('PATCH', `/whatsapp/quick-replies/${id}`, data),
      deleteQuickReply: (id: string) =>
        request<{ deleted: true }>('DELETE', `/whatsapp/quick-replies/${id}`),
    },
    finance: {
      incomes: {
        findAll: (query?: {
          source?: string;
          from?: string;
          to?: string;
          relatedOrderId?: string;
          limit?: number;
          offset?: number;
        }) => request<Income[]>('GET', '/finance/incomes', undefined, query),
        findOne: (id: string) => request<Income>('GET', `/finance/incomes/${id}`),
        create: (data: CreateIncomeDto) => request<Income>('POST', '/finance/incomes', data),
        update: (id: string, data: UpdateIncomeDto) =>
          request<Income>('PATCH', `/finance/incomes/${id}`, data),
        remove: (id: string) => request<Income>('DELETE', `/finance/incomes/${id}`),
      },
      expenseCategories: {
        findAll: () => request<ExpenseCategory[]>('GET', '/finance/expense-categories'),
        findOne: (id: string) =>
          request<ExpenseCategory>('GET', `/finance/expense-categories/${id}`),
        create: (data: CreateExpenseCategoryDto) =>
          request<ExpenseCategory>('POST', '/finance/expense-categories', data),
        update: (id: string, data: UpdateExpenseCategoryDto) =>
          request<ExpenseCategory>('PATCH', `/finance/expense-categories/${id}`, data),
        remove: (id: string) =>
          request<ExpenseCategory>('DELETE', `/finance/expense-categories/${id}`),
      },
      expenses: {
        findAll: (query?: {
          categoryId?: string;
          supplierId?: string;
          status?: string;
          from?: string;
          to?: string;
          limit?: number;
          offset?: number;
        }) => request<Expense[]>('GET', '/finance/expenses', undefined, query),
        findOne: (id: string) => request<Expense>('GET', `/finance/expenses/${id}`),
        create: (data: CreateExpenseDto) => request<Expense>('POST', '/finance/expenses', data),
        update: (id: string, data: UpdateExpenseDto) =>
          request<Expense>('PATCH', `/finance/expenses/${id}`, data),
        remove: (id: string) => request<Expense>('DELETE', `/finance/expenses/${id}`),
        uploadReceipt: (id: string, data: UploadExpenseReceiptDto) =>
          request<{ key: string }>('POST', `/finance/expenses/${id}/receipts`, data),
        receiptDownloadUrl: (id: string, key: string) =>
          buildURL(baseURL, `/finance/expenses/${id}/receipts/download`, { key }),
      },
      reports: {
        cashFlow: (from: string, to: string) =>
          request<CashFlowReport>('GET', '/finance/reports/cash-flow', undefined, { from, to }),
      },
      storeCredits: {
        findAll: () => request<AdminStoreCredit[]>('GET', '/finance/store-credits'),
        issue: (data: IssueStoreCreditDto) =>
          request<AdminStoreCredit>('POST', '/finance/store-credits', data),
        update: (id: string, data: UpdateStoreCreditDto) =>
          request<AdminStoreCredit>('PATCH', `/finance/store-credits/${id}`, data),
      },
      giftCards: {
        findAll: () => request<GiftCard[]>('GET', '/finance/gift-cards'),
        create: (data: CreateGiftCardDto) =>
          request<GiftCard>('POST', '/finance/gift-cards', data),
        update: (id: string, data: UpdateGiftCardDto) =>
          request<GiftCard>('PATCH', `/finance/gift-cards/${id}`, data),
      },
    },
    notifications: {
      pushTokens: {
        register: (data: { token: string; platform: 'ios' | 'android' | 'web' }) =>
          request<{ id: string; token: string; platform: string }>(
            'POST',
            '/notifications/push-tokens',
            data,
          ),
        remove: (token: string) =>
          request<void>('DELETE', `/notifications/push-tokens/${encodeURIComponent(token)}`),
      },
      preferences: {
        get: () =>
          request<{
            emailOptOut: boolean;
            marketingEmailOptOut: boolean;
            whatsappOptOut: boolean;
          }>('GET', '/notifications/preferences'),
        update: (data: {
          emailOptOut?: boolean;
          marketingEmailOptOut?: boolean;
          whatsappOptOut?: boolean;
        }) =>
          request<{
            emailOptOut: boolean;
            marketingEmailOptOut: boolean;
            whatsappOptOut: boolean;
          }>('PATCH', '/notifications/preferences', data),
      },
    },
    marketing: {
      listPromotions: () =>
        request<Array<Pick<Promotion, 'id' | 'name'>>>('GET', '/marketing/promotions'),
      distributePromo: (data: DistributePromoDto) =>
        request<DistributePromoResponse>('POST', '/marketing/campaigns/promo', data),
      listPlacementsAdmin: (query?: AdminMarketingPlacementsQuery) =>
        request<MarketingPlacement[]>(
          'GET',
          '/marketing/placements/admin/list',
          undefined,
          query as AdminMarketingPlacementsQuery & Record<string, string | boolean | undefined>,
        ),
      getPlacement: (id: string) =>
        request<MarketingPlacement>('GET', `/marketing/placements/${id}`),
      createPlacement: (data: CreateMarketingPlacementDto) =>
        request<MarketingPlacement>('POST', '/marketing/placements', data),
      updatePlacement: (id: string, data: UpdateMarketingPlacementDto) =>
        request<MarketingPlacement>('PATCH', `/marketing/placements/${id}`, data),
      deletePlacement: (id: string) =>
        request<MarketingPlacement>('DELETE', `/marketing/placements/${id}`),
      getActivePlacements: (platform: ActiveMarketingPlatform) =>
        request<ActivePlacementsResponse>('GET', '/marketing/placements/active', undefined, {
          platform,
        }),
    },
    promotions: {
      findAll: (query?: AdminPromotionsQuery) =>
        request<Promotion[]>(
          'GET',
          '/promotions',
          undefined,
          query as AdminPromotionsQuery & Record<string, string | boolean | undefined>,
        ),
      findOne: (id: string) => request<Promotion>('GET', `/promotions/${id}`),
      create: (data: CreatePromotionDto) => request<Promotion>('POST', '/promotions', data),
      update: (id: string, data: UpdatePromotionDto) =>
        request<Promotion>('PATCH', `/promotions/${id}`, data),
      delete: (id: string) => request<Promotion>('DELETE', `/promotions/${id}`),
      createCoupon: (promotionId: string, data: CreateAdminCouponDto) =>
        request<Coupon>('POST', `/promotions/${promotionId}/coupons`, data),
      updateCoupon: (couponId: string, data: UpdateCouponDto) =>
        request<Coupon>('PATCH', `/promotions/coupons/${couponId}`, data),
      deleteCoupon: (couponId: string) =>
        request<Coupon>('DELETE', `/promotions/coupons/${couponId}`),
      createDiscountRule: (promotionId: string, data: CreateDiscountRuleDto) =>
        request<DiscountRule>('POST', `/promotions/${promotionId}/rules`, data),
      updateDiscountRule: (ruleId: string, data: UpdateDiscountRuleDto) =>
        request<DiscountRule>('PATCH', `/promotions/rules/${ruleId}`, data),
      deleteDiscountRule: (ruleId: string) =>
        request<DiscountRule>('DELETE', `/promotions/rules/${ruleId}`),
    },
    search: {
      products: (query: string, limit?: number) =>
        request<SearchResultItem[]>('GET', '/search', undefined, { q: query, limit }),
      reindex: () =>
        request<{ indexed: number; meilisearchEnabled: boolean }>('POST', '/search/admin/reindex'),
    },
    catalog: {
      browse: (query?: CatalogQuery & { attr?: string | string[] }) =>
        request<CatalogResponse>(
          'GET',
          '/catalog',
          undefined,
          query as Record<string, string | number | boolean | undefined>,
        ),
    },
    analytics: {
      trackEvent: (data: {
        event: string;
        properties?: Record<string, unknown>;
        sessionId?: string;
        userId?: string;
        source?: 'web' | 'mobile' | 'api';
      }) => request<void>('POST', '/analytics/events', data),
      getOverview: (days: number) =>
        request<AnalyticsOverviewReport>('GET', '/analytics/overview', undefined, { days }),
      getFunnel: (days: number) =>
        request<Record<string, number>>('GET', '/analytics/funnel', undefined, { days }),
      getCohorts: (weeks: number) =>
        request<CohortRetentionReport>('GET', '/analytics/cohorts', undefined, { weeks }),
    },
    chat: {
      createSession: (data?: { contactName?: string }) =>
        request<ChatSession>('POST', '/chat/sessions', data ?? {}),
      sendMessage: (sessionId: string, content: string) =>
        request<Message[]>('POST', `/chat/sessions/${sessionId}/messages`, { content }),
      listMessages: (sessionId: string) =>
        request<Message[]>('GET', `/chat/sessions/${sessionId}/messages`),
    },
    ai: {
      getCmsPage: (slug: string) => request<CmsPage>('GET', `/ai/cms-pages/${slug}`),
      faqs: {
        findPublished: () => request<Faq[]>('GET', '/ai/faqs'),
        findAllAdmin: () => request<Faq[]>('GET', '/ai/faqs/admin'),
        create: (data: CreateFaqDto) => request<Faq>('POST', '/ai/faqs', data),
        update: (id: string, data: UpdateFaqDto) => request<Faq>('PATCH', `/ai/faqs/${id}`, data),
        remove: (id: string) => request<{ success: boolean }>('DELETE', `/ai/faqs/${id}`),
      },
      cmsPages: {
        findBySlug: (slug: string) => request<CmsPage>('GET', `/ai/cms-pages/${slug}`),
        findAllAdmin: () => request<CmsPage[]>('GET', '/ai/cms-pages/admin/list'),
        create: (data: CreateCmsPageDto) => request<CmsPage>('POST', '/ai/cms-pages', data),
        update: (id: string, data: UpdateCmsPageDto) =>
          request<CmsPage>('PATCH', `/ai/cms-pages/${id}`, data),
        remove: (id: string) => request<{ success: boolean }>('DELETE', `/ai/cms-pages/${id}`),
      },
      products: {
        generateContent: (productId: string) =>
          request<ProductContentDraft>('POST', `/ai/products/${productId}/generate-content`),
        getDraft: (productId: string) =>
          request<ProductContentDraft | null>('GET', `/ai/products/${productId}/content-draft`),
        approveDraft: (productId: string) =>
          request<Product>('POST', `/ai/products/${productId}/content-draft/approve`),
        rejectDraft: (productId: string) =>
          request<{ success: boolean }>('POST', `/ai/products/${productId}/content-draft/reject`),
      },
    },
    reviews: {
      listByProduct: (productId: string) =>
        request<ProductReview[]>('GET', `/reviews/products/${productId}`),
      summary: (productId: string) =>
        request<ProductReviewSummary>('GET', `/reviews/products/${productId}/summary`),
      create: (productId: string, data: CreateProductReviewDto) =>
        request<ProductReview>('POST', `/reviews/products/${productId}`, data),
      listPending: (limit?: number) =>
        request<ProductReview[]>('GET', '/reviews/moderation/pending', undefined, { limit }),
      moderate: (id: string, data: UpdateReviewStatusDto) =>
        request<ProductReview>('PATCH', `/reviews/${id}/status`, data),
      externalSummary: () => request<ExternalReviewSummary>('GET', '/reviews/external/summary'),
    },
    loyalty: {
      me: () => request<LoyaltyAccount>('GET', '/loyalty/me'),
      transactions: (limit?: number) =>
        request<LoyaltyTransaction[]>('GET', '/loyalty/me/transactions', undefined, { limit }),
      quoteRedemption: (subtotal: number, points?: number) =>
        request<LoyaltyRedemptionQuote>('GET', '/loyalty/me/redemption-quote', undefined, {
          subtotal,
          points,
        }),
    },
    referrals: {
      myCode: () => request<ReferralCode>('GET', '/referrals/me/code'),
      myPerformance: () => request<ReferralPerformanceReport>('GET', '/referrals/me/performance'),
      adminPerformance: () =>
        request<ReferralPerformanceReport>('GET', '/referrals/admin/performance'),
      payout: (conversionId: string, data: PayoutReferralDto) =>
        request<ReferralConversion>(
          'POST',
          `/referrals/admin/conversions/${conversionId}/payout`,
          data,
        ),
    },
    b2b: {
      listCompanies: () => request<Company[]>('GET', '/b2b/companies'),
      createCompany: (data: CreateCompanyDto) => request<Company>('POST', '/b2b/companies', data),
      updateCompany: (id: string, data: UpdateCompanyDto) =>
        request<Company>('PATCH', `/b2b/companies/${id}`, data),
      addUser: (companyId: string, data: { userId: string; role?: string }) =>
        request<CompanyUser>('POST', `/b2b/companies/${companyId}/users`, data),
      listPrices: (companyId: string) =>
        request<CompanyPriceListItem[]>('GET', `/b2b/companies/${companyId}/prices`),
      upsertPrice: (companyId: string, data: UpsertCompanyPriceDto) =>
        request<CompanyPriceListItem>('POST', `/b2b/companies/${companyId}/prices`, data),
      bulkImport: (companyId: string, rows: UpsertCompanyPriceDto[]) =>
        request<BulkOrderImportResult>('POST', `/b2b/companies/${companyId}/bulk-orders`, { rows }),
      myCompany: () => request<{ company: Company; role: string } | null>('GET', '/b2b/me/company'),
    },
    quotes: {
      create: (data: CreateQuoteDto) => request<Quote>('POST', '/quotes', data),
      mine: () => request<Quote[]>('GET', '/quotes/me'),
      adminList: (status?: string) =>
        request<Quote[]>('GET', '/quotes/admin', undefined, { status }),
      findOne: (id: string) => request<Quote>('GET', `/quotes/${id}`),
      updateStatus: (id: string, data: UpdateQuoteStatusDto) =>
        request<Quote>('PATCH', `/quotes/${id}/status`, data),
      convert: (id: string) => request<ConvertQuoteResult>('POST', `/quotes/${id}/convert`),
    },
    marketplace: {
      channels: () => request<MarketplaceChannelProfile[]>('GET', '/marketplace/channels'),
      listings: (channel?: string) =>
        request<MarketplaceListing[]>('GET', '/marketplace/listings', undefined, { channel }),
      syncProduct: (productId: string, channel?: string) =>
        request<MarketplaceListing>('POST', `/marketplace/products/${productId}/sync`, undefined, { channel }),
      importOrder: (data: MarketplaceImportOrderDto) =>
        request<MarketplaceOrderImport>('POST', '/marketplace/orders/import', data),
    },
    accounting: {
      providers: () => request<AccountingProviderProfile[]>('GET', '/accounting/providers'),
      syncRecords: () => request<AccountingSyncRecord[]>('GET', '/accounting/sync-records'),
      syncInvoice: (id: string) => request<void>('POST', `/accounting/invoices/${id}/sync`),
      marketplaceFees: () =>
        request<MarketplaceFeeReconciliation[]>('GET', '/accounting/marketplace-fees'),
      syncMarketplaceFee: (orderId: string) =>
        request<void>('POST', `/accounting/marketplace-fees/${orderId}/sync`),
    },
    privacy: {
      exportMine: () => request<PrivacyExportBundle>('GET', '/privacy/me/export'),
      deleteMine: () => request<PrivacyDeletionResult>('DELETE', '/privacy/me'),
      ccpaOptOut: (optOut: boolean) =>
        request<CcpaOptOutResult>('PATCH', '/privacy/me/ccpa-opt-out', { optOut }),
    },
    pos: {
      listLocations: (pickup?: boolean) =>
        request<StoreLocation[]>('GET', '/pos/locations', undefined, { pickup: pickup ? 'true' : undefined }),
      createLocation: (data: CreateStoreLocationDto) => request<StoreLocation>('POST', '/pos/locations', data),
      listRegisters: (locationId?: string) =>
        request<PosRegister[]>('GET', '/pos/registers', undefined, { locationId }),
      createRegister: (data: CreatePosRegisterDto) => request<PosRegister>('POST', '/pos/registers', data),
      createOrder: (data: CreatePosOrderDto) => request<unknown>('POST', '/pos/orders', data),
    },
    subscriptions: {
      listPlans: () => request<SubscriptionPlan[]>('GET', '/subscriptions/plans'),
      createPlan: (data: CreateSubscriptionPlanDto) =>
        request<SubscriptionPlan>('POST', '/subscriptions/plans', data),
      mine: () => request<CustomerSubscription[]>('GET', '/subscriptions/me'),
      subscribe: (planId: string) => request<{ url: string }>('POST', '/subscriptions/subscribe', { planId }),
      portal: () => request<{ url: string }>('POST', '/subscriptions/portal'),
    },
    sellers: {
      list: (status?: string) => request<Seller[]>('GET', '/sellers', undefined, { status }),
      create: (data: CreateSellerDto) => request<Seller>('POST', '/sellers', data),
      update: (id: string, data: UpdateSellerDto) => request<Seller>('PATCH', `/sellers/${id}`, data),
      listPayouts: (sellerId?: string) =>
        request<SellerPayout[]>('GET', '/sellers/payouts', undefined, { sellerId }),
      markPayoutPaid: (id: string) => request<SellerPayout>('POST', `/sellers/payouts/${id}/mark-paid`),
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
