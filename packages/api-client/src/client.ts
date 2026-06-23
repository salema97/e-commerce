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
} from '@repo/shared-types';

export interface ApiClientOptions {
  baseURL: string;
  getToken?: () => string | null | Promise<string | null>;
  onError?: (error: ApiClientError) => void;
  getHeaders?: () => Record<string, string> | Promise<Record<string, string>>;
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
  const url = new URL(path, baseURL);

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
  const { baseURL, getToken, onError, getHeaders } = options;

  async function request<T>(
    method: string,
    path: string,
    body?: unknown,
    query?: Record<string, string | number | boolean | undefined>,
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
      getMe: () => request<User>('GET', '/auth/me'),
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
      findOne: (id: string) => request<Product>('GET', `/products/${id}`),
      findBySlug: (slug: string) => request<Product>('GET', `/products/slug/${slug}`),
      create: (data: CreateProductDto) => request<Product>('POST', '/products', data),
      update: (id: string, data: UpdateProductDto) => request<Product>('PATCH', `/products/${id}`, data),
      remove: (id: string) => request<Product>('DELETE', `/products/${id}`),
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
      findOne: (id: string) => request<Order>('GET', `/orders/${id}`),
      create: (data: CreateOrderDto) => request<CreatedOrderResult>('POST', '/orders', data),
      updateStatus: (id: string, data: UpdateOrderStatusDto) =>
        request<Order>('PATCH', `/orders/${id}/status`, data),
      createPaymentIntent: (id: string, data: CreatePaymentIntentDto) => request<PaymentIntentResult>('POST', `/orders/${id}/payment-intent`, data),
      listRefunds: (id: string) => request<Refund[]>('GET', `/orders/${id}/refunds`),
      createRefund: (id: string, data: CreateRefundDto) => request<Refund>('POST', `/orders/${id}/refunds`, data),
      generateReceipt: (id: string) => request<ReceiptResponse>('POST', `/orders/${id}/receipt`),
      getReceipt: (id: string) => request<ReceiptResponse>('GET', `/orders/${id}/receipt`),
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
      update: (id: string, data: { status?: string; assignedAgentId?: string }) => request<Conversation>('PATCH', `/conversations/${id}`, data),
    },
    messages: {
      findAll: (conversationId: string, query?: { page?: number; limit?: number }) => request<PaginatedMessages>('GET', `/conversations/${conversationId}/messages`, undefined, query),
      create: (conversationId: string, data: { content: string }) => request<Message>('POST', `/conversations/${conversationId}/messages`, data),
    },
    whatsapp: {
      getQuickReplies: () => request<QuickReply[]>('GET', '/whatsapp/quick-replies'),
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
      },
    },
  };
}

export type ApiClient = ReturnType<typeof createApiClient>;
