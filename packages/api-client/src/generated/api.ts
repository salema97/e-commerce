/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export interface RegisterDto {
  /** @example "cliente@example.com" */
  email: string;
  /** @example "SeedDemo123!" */
  password: string;
  /** @example "María Pérez" */
  name?: string;
  /** @example "+593999888777" */
  phone?: string;
}

export interface LoginDto {
  /** @example "store-admin@example.com" */
  email: string;
  /** @example "SeedDemo123!" */
  password: string;
}

export type CreatePaymentIntentDto = object;

export type CreateTestPaymentDto = object;

export type InvoiceResponseDto = object;

export type IssueInvoiceDto = object;

export interface IssueCreditNoteDto {
  /** Return request id to issue the credit note for */
  returnRequestId: string;
  /** Override the total credit amount */
  total?: string;
}

export type CreditNoteResponseDto = object;

export interface IssueSupplementaryDocumentDto {
  documentType: "05" | "06" | "07";
  /** @format uuid */
  orderId: string;
  parentInvoiceAccessKey?: string;
  reason?: string;
  totalAmount?: number;
}

export type CreateTestInvoiceDto = object;

export interface CreateWhatsAppQuickReplyDto {
  label: string;
  text: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateWhatsAppQuickReplyDto {
  label?: string;
  text?: string;
  sortOrder?: number;
  isActive?: boolean;
}

export interface UpdateConversationDto {
  status?: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
  /** @format uuid */
  assignedAgentId?: string;
  /** Internal support notes (not sent to customer) */
  internalNotes?: string;
}

export interface CreateMessageDto {
  /** @example "Hello, how can we help?" */
  content: string;
}

export interface CreateInventoryDto {
  /** @example "00000000-0000-0000-0000-000000000000" */
  productId: string;
  /** @example "00000000-0000-0000-0000-000000000001" */
  variantId?: string;
  /** @example 100 */
  quantity?: number;
  /** @example 0 */
  reservedQuantity?: number;
  /** @example 10 */
  lowStockThreshold?: number;
}

export interface UpdateInventoryDto {
  /** @example "00000000-0000-0000-0000-000000000000" */
  productId?: string;
  /** @example "00000000-0000-0000-0000-000000000001" */
  variantId?: string;
  /** @example 100 */
  quantity?: number;
  /** @example 0 */
  reservedQuantity?: number;
  /** @example 10 */
  lowStockThreshold?: number;
}

export interface ReserveInventoryDto {
  /** @example 5 */
  quantity: number;
}

export interface RegisterPushTokenDto {
  /** @example "ExponentPushToken[xxxxxxxxxxxxxxxxxxxxxx]" */
  token: string;
  platform: "ios" | "android" | "web";
}

export interface UpdateNotificationPreferencesDto {
  emailOptOut?: boolean;
  marketingEmailOptOut?: boolean;
  whatsappOptOut?: boolean;
}

export interface DistributePromoDto {
  segment:
    | "ALL_CUSTOMERS"
    | "HAS_ACTIVE_CART"
    | "RECENT_BUYERS"
    | "INACTIVE_BUYERS";
  promotionId: string;
}

export interface CreateUserDto {
  /** @example "customer@example.com" */
  email: string;
  /** @example "SeedDemo123!" */
  password?: string;
  /** @example "+593999999999" */
  phone?: string;
  /** @example "CUSTOMER" */
  role?:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "FINANCE"
    | "INVENTORY"
    | "SUPPORT"
    | "CUSTOMER"
    | "GUEST";
  /** @example "María Pérez" */
  name?: string;
}

export interface UpdateUserDto {
  /** @example "customer@example.com" */
  email?: string;
  /** @example "SeedDemo123!" */
  password?: string;
  /** @example "+593999999999" */
  phone?: string;
  /** @example "CUSTOMER" */
  role?:
    | "SUPER_ADMIN"
    | "ADMIN"
    | "FINANCE"
    | "INVENTORY"
    | "SUPPORT"
    | "CUSTOMER"
    | "GUEST";
  /** @example "María Pérez" */
  name?: string;
}

export interface CreateCategoryDto {
  /** @example "Electronics" */
  name: string;
  /** @example "electronics" */
  slug: string;
  /** @example "Devices and gadgets" */
  description?: string;
  /** @example "00000000-0000-0000-0000-000000000000" */
  parentId?: string;
  /** @example true */
  isActive?: boolean;
}

export interface UpdateCategoryDto {
  /** @example "Electronics" */
  name?: string;
  /** @example "electronics" */
  slug?: string;
  /** @example "Devices and gadgets" */
  description?: string;
  /** @example "00000000-0000-0000-0000-000000000000" */
  parentId?: string;
  /** @example true */
  isActive?: boolean;
}

export interface CreateProductVariantDto {
  /** @example "PROD-001-BLK" */
  sku: string;
  /** @example "Black" */
  name: string;
  /** @example 19.99 */
  price?: number;
}

export interface CreateProductAttributeDto {
  /** @example "Color" */
  name: string;
  /** @example "Black" */
  value: string;
}

export interface CreateProductImageDto {
  /** @example "https://cdn.example.com/image.png" */
  url: string;
  /** @example "Product photo" */
  alt?: string;
  /** @example 0 */
  sortOrder?: number;
}

export interface CreateProductDto {
  /** @example "Wireless Headphones" */
  name: string;
  /** @example "wireless-headphones" */
  slug: string;
  /** @example "High-quality wireless headphones" */
  description?: string;
  /** @example "PROD-001" */
  sku?: string;
  /** @example "ACTIVE" */
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  /** @example 49.99 */
  price: number;
  /** @example 59.99 */
  compareAtPrice?: number;
  /** @example 25 */
  cost?: number;
  /** @example false */
  isFeatured?: boolean;
  /** @example "00000000-0000-0000-0000-000000000000" */
  categoryId?: string;
  /** @example "00000000-0000-0000-0000-000000000001" */
  supplierId?: string;
  variants?: CreateProductVariantDto[];
  attributes?: CreateProductAttributeDto[];
  images?: CreateProductImageDto[];
}

export interface CreateBackInStockAlertDto {
  /** @example "cliente@example.com" */
  email: string;
}

export interface UpdateProductDto {
  /** @example "Wireless Headphones" */
  name?: string;
  /** @example "wireless-headphones" */
  slug?: string;
  /** @example "High-quality wireless headphones" */
  description?: string;
  /** @example "PROD-001" */
  sku?: string;
  /** @example "ACTIVE" */
  status?: "DRAFT" | "ACTIVE" | "ARCHIVED";
  /** @example 49.99 */
  price?: number;
  /** @example 59.99 */
  compareAtPrice?: number;
  /** @example 25 */
  cost?: number;
  /** @example false */
  isFeatured?: boolean;
  /** @example "00000000-0000-0000-0000-000000000000" */
  categoryId?: string;
  /** @example "00000000-0000-0000-0000-000000000001" */
  supplierId?: string;
  variants?: CreateProductVariantDto[];
  attributes?: CreateProductAttributeDto[];
  images?: CreateProductImageDto[];
}

export type CreateFaqDto = object;

export type UpdateFaqDto = object;

export type CreateCmsPageDto = object;

export type UpdateCmsPageDto = object;

export type CreateChatSessionDto = object;

export type SendChatMessageDto = object;

export interface CreateSupplierDto {
  /** @example "Acme Supplies" */
  name: string;
  /** @example "9999999999001" */
  rucOrId?: string;
  /** @example "Maria Garcia" */
  contactName?: string;
  /** @example "contact@acme.com" */
  email?: string;
  /** @example "+593999999999" */
  phone?: string;
  /** @example "Quito, Ecuador" */
  address?: string;
  /** @example "Net 30" */
  paymentTerms?: string;
  /** @example true */
  isActive?: boolean;
}

export interface UpdateSupplierDto {
  /** @example "Acme Supplies" */
  name?: string;
  /** @example "9999999999001" */
  rucOrId?: string;
  /** @example "Maria Garcia" */
  contactName?: string;
  /** @example "contact@acme.com" */
  email?: string;
  /** @example "+593999999999" */
  phone?: string;
  /** @example "Quito, Ecuador" */
  address?: string;
  /** @example "Net 30" */
  paymentTerms?: string;
  /** @example true */
  isActive?: boolean;
}

export interface CreateOrderItemDto {
  productId: string;
  variantId?: string;
  quantity: number;
  price: number;
}

export interface CreateOrderDto {
  items: CreateOrderItemDto[];
  channel?: "WEB" | "MOBILE" | "POS" | "B2B" | "MARKETPLACE";
  couponCode?: string;
  referralCode?: string;
  loyaltyPointsToRedeem?: number;
  customerEmail?: string;
  customerPhone?: string;
  customerName?: string;
  customerIdentification?: string;
  customerAddress?: string;
  shippingAddress?: object;
  billingAddress?: object;
  notes?: string;
  companyId?: string;
  purchaseOrderNumber?: string;
  netPaymentTerms?: "NET_0" | "NET_15" | "NET_30" | "NET_60";
  shippingMethod?: "DELIVERY" | "PICKUP" | "POS_IMMEDIATE";
  pickupLocationId?: string;
  posRegisterId?: string;
  /** hCaptcha token when CAPTCHA_PROVIDER=hcaptcha */
  captchaToken?: string;
}

export interface UpdateOrderStatusDto {
  status:
    | "PENDING"
    | "PAYMENT_PENDING"
    | "PROCESSING"
    | "READY_FOR_PICKUP"
    | "PARTIALLY_SHIPPED"
    | "SHIPPED"
    | "DELIVERED"
    | "CANCELLED"
    | "REFUNDED"
    | "PAYMENT_FAILED"
    | "PARTIALLY_REFUNDED";
}

export interface CancelOrderDto {
  /**
   * Email used at checkout for guest orders without an account
   * @example "guest@example.com"
   */
  guestEmail?: string;
}

export interface CreateRefundDto {
  /** Refund amount in major currency units */
  amount: number;
  type: "full" | "partial";
  reason?: string;
}

export interface ShippingQuoteDto {
  /** @example "EC" */
  country?: string;
  /** @example "Pichincha" */
  province?: string;
  /** @example "Quito" */
  city?: string;
  street?: string;
  zipCode?: string;
  /** @example 75.5 */
  subtotal: number;
  /** Coupon grants free shipping */
  freeShipping?: boolean;
  /**
   * Parcel weight in kg
   * @example 1.2
   */
  weightKg?: number;
}

export interface CreateReturnItemDto {
  productId: string;
  productVariantId?: string;
  quantity: number;
  condition?: "NEW" | "USED" | "DAMAGED";
  /** Per-unit refund value in major currency units */
  refundValue?: number;
}

export interface CreateReturnDto {
  items: CreateReturnItemDto[];
  reason: string;
  refundMethod?: "ORIGINAL_PAYMENT" | "STORE_CREDIT" | "EXCHANGE";
}

export interface CreateGuestReturnRequestDto {
  /** Order id to request a return for */
  orderId: string;
  /** Email address associated with the order */
  email: string;
  items: CreateReturnItemDto[];
  reason: string;
  refundMethod?: "ORIGINAL_PAYMENT" | "STORE_CREDIT" | "EXCHANGE";
}

export interface UpdateReturnShippingDto {
  returnCarrier?: string;
  returnTrackingNumber?: string;
  returnTrackingUrl?: string;
}

export interface UpdateReturnStatusDto {
  status:
    | "REQUESTED"
    | "APPROVED"
    | "REJECTED"
    | "INSPECTION"
    | "RESOLVED"
    | "RESOLUTION_PENDING_CREDIT_NOTE"
    | "CLOSED";
  /** Required when transitioning to RESOLVED */
  refundMethod?: "ORIGINAL_PAYMENT" | "STORE_CREDIT" | "EXCHANGE";
  notes?: string;
  creditNoteId?: string;
}

export interface ResolveReturnDto {
  /** How the return will be settled */
  refundMethod: "ORIGINAL_PAYMENT" | "STORE_CREDIT" | "EXCHANGE";
  /** Internal notes about the resolution */
  notes?: string;
  /** Replacement product id for EXCHANGE */
  exchangeProductId?: string;
  /** Replacement product variant id for EXCHANGE */
  exchangeVariantId?: string;
}

export interface WmsInventoryRecordDto {
  sku: string;
  quantity: number;
  warehouseCode?: string;
}

export interface WmsSyncInventoryDto {
  records: WmsInventoryRecordDto[];
}

export interface WmsTrackingEventDto {
  externalShipmentId: string;
  trackingNumber?: string;
  trackingUrl?: string;
  status?:
    | "PENDING"
    | "LABEL_CREATED"
    | "IN_TRANSIT"
    | "DELIVERED"
    | "RETURNED"
    | "CANCELLED";
}

export interface WmsImportTrackingDto {
  events: WmsTrackingEventDto[];
}

export interface ShipmentLineDto {
  orderItemId: string;
  /** @example 1 */
  quantity: number;
}

export interface CreateShipmentDto {
  /** @example "Servientrega" */
  carrier: string;
  /** @example "EC123456789" */
  trackingNumber?: string;
  /** @example "https://www.servientrega.com.ec/rastreo/EC123456789" */
  trackingUrl?: string;
  /** @example 5 */
  shippingCost?: number;
  /** Split-shipment line items */
  items?: ShipmentLineDto[];
}

export interface CreateIncomeDto {
  /** @example "ORDER" */
  source: "ORDER" | "INVESTMENT" | "OTHER";
  /** @example 150.5 */
  amount: number;
  /**
   * @format date-time
   * @example "2026-06-01T00:00:00.000Z"
   */
  date?: string;
  /** @format uuid */
  relatedOrderId?: string;
  /** @example "March storefront sales" */
  notes?: string;
}

export type IncomeResponseDto = object;

export interface UpdateIncomeDto {
  /** @example "ORDER" */
  source?: "ORDER" | "INVESTMENT" | "OTHER";
  /** @example 150.5 */
  amount?: number;
  /**
   * @format date-time
   * @example "2026-06-01T00:00:00.000Z"
   */
  date?: string;
  /** @format uuid */
  relatedOrderId?: string;
  /** @example "March storefront sales" */
  notes?: string;
}

export interface CreateExpenseCategoryDto {
  /** @example "Logistics" */
  name: string;
  /** @example "Shipping and courier costs" */
  description?: string;
}

export type ExpenseCategoryResponseDto = object;

export interface UpdateExpenseCategoryDto {
  /** @example "Logistics" */
  name?: string;
  /** @example "Shipping and courier costs" */
  description?: string;
}

export interface CreateExpenseDto {
  /** @format uuid */
  categoryId?: string;
  /** @format uuid */
  supplierId?: string;
  /** @example 250.75 */
  amount: number;
  /** @format date-time */
  date?: string;
  status?: "PENDING" | "PAID" | "CANCELLED";
  description?: string;
}

export interface UpdateExpenseDto {
  /** @format uuid */
  categoryId?: object;
  /** @format uuid */
  supplierId?: object;
  amount?: number;
  /** @format date-time */
  date?: string;
  status?: "PENDING" | "PAID" | "CANCELLED";
  description?: object;
}

export interface UploadExpenseReceiptDto {
  /** @example "receipt.pdf" */
  fileName: string;
  /** Base64-encoded file content */
  contentBase64: string;
  /** @example "application/pdf" */
  contentType?: string;
}

export interface IssueStoreCreditDto {
  /** @format uuid */
  userId: string;
  amount: number;
  /** @default "USD" */
  currency?: string;
  expiresAt?: string;
}

export interface UpdateStoreCreditDto {
  balance?: number;
  expiresAt?: object | null;
}

export interface CreateGiftCardDto {
  /** Auto-generated when omitted */
  code?: string;
  initialBalance: number;
  /** @default "USD" */
  currency?: string;
  expiresAt?: string;
  /** @format uuid */
  issuedToUserId?: string;
  note?: string;
}

export interface UpdateGiftCardDto {
  balance?: number;
  expiresAt?: object | null;
  isActive?: boolean;
  note?: object | null;
}

export type TrackAnalyticsEventDto = object;

export type ReportClientErrorDto = object;

export interface CreateProductReviewDto {
  /**
   * @min 1
   * @max 5
   */
  rating: number;
  title?: string;
  body: string;
  orderId?: string;
}

export interface UpdateReviewStatusDto {
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export type PayoutReferralDto = object;

export type CreateCompanyDto = object;

export type UpdateCompanyDto = object;

export type AddCompanyUserDto = object;

export type UpsertCompanyPriceDto = object;

export type BulkOrderImportDto = object;

export type CreateQuoteDto = object;

export type UpdateQuoteStatusDto = object;

export type MarketplaceImportOrderDto = object;

export type UpdateCcpaOptOutDto = object;

export interface CreateStoreLocationDto {
  code: string;
  name: string;
  address: string;
  city?: string;
  province?: string;
  phone?: string;
  supportsPickup?: boolean;
  supportsPos?: boolean;
  isActive?: boolean;
}

export interface UpdateStoreLocationDto {
  name?: string;
  address?: string;
  city?: string;
  province?: string;
  phone?: string;
  supportsPickup?: boolean;
  supportsPos?: boolean;
  isActive?: boolean;
}

export interface CreatePosRegisterDto {
  locationId: string;
  code: string;
  name: string;
  isActive?: boolean;
}

export interface UpdatePosRegisterDto {
  name?: string;
  isActive?: boolean;
}

export interface PosOrderItemDto {
  productId: string;
  variantId?: string;
  quantity: number;
}

export interface CreatePosOrderDto {
  posRegisterId: string;
  customerEmail: string;
  customerName?: string;
  customerPhone?: string;
  customerIdentification?: string;
  paymentProvider: "CASH" | "STRIPE";
  items: PosOrderItemDto[];
  notes?: string;
}

export interface CreateSubscriptionPlanDto {
  productId: string;
  stripeProductId?: string;
  stripePriceId?: string;
  interval?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  intervalCount?: number;
  trialDays?: number;
  isActive?: boolean;
}

export interface UpdateSubscriptionPlanDto {
  stripeProductId?: string;
  stripePriceId?: string;
  interval?: "WEEKLY" | "MONTHLY" | "QUARTERLY" | "YEARLY";
  intervalCount?: number;
  trialDays?: number;
  isActive?: boolean;
}

export interface SubscribeDto {
  planId: string;
}

export interface CreateSellerDto {
  userId: string;
  businessName: string;
  slug: string;
  commissionRate?: number;
}

export interface UpdateSellerDto {
  businessName?: string;
  slug?: string;
  commissionRate?: number;
  status?: "PENDING" | "ACTIVE" | "SUSPENDED" | "REJECTED";
}

export interface CreateMarketplaceDisputeDto {
  orderId: string;
  sellerId: string;
  reason: string;
}

export interface ResolveMarketplaceDisputeDto {
  status: "RESOLVED_BUYER" | "RESOLVED_SELLER" | "CLOSED";
  resolutionNotes?: string;
}

export interface ImportProductsCsvDto {
  /**
   * CSV text with header: name,slug,sku,price,categorySlug,stock,status,description
   * @example "name,slug,sku,price,categorySlug,stock,status,description
   * Camiseta,camiseta,CAM-001,19.99,ropa,50,ACTIVE,Camiseta algodón"
   */
  csv: string;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title E-commerce API
 * @version 1.0
 * @contact
 *
 * REST API for the e-commerce platform
 */
export class Api<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  v1 = {
    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerRegister
     * @summary Register a new customer account
     * @request POST:/v1/auth/register
     */
    authControllerRegister: (data: RegisterDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/auth/register`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerLogin
     * @summary Login with email and password
     * @request POST:/v1/auth/login
     */
    authControllerLogin: (data: LoginDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/auth/login`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerRefresh
     * @summary Rotate refresh token and issue new access token
     * @request POST:/v1/auth/refresh
     */
    authControllerRefresh: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/auth/refresh`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerLogout
     * @summary Revoke refresh token session
     * @request POST:/v1/auth/logout
     */
    authControllerLogout: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/auth/logout`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags auth
     * @name AuthControllerMe
     * @summary Get current authenticated user profile
     * @request GET:/v1/auth/me
     */
    authControllerMe: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/auth/me`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags StripeWebhook
     * @name StripeWebhookControllerHandleWebhook
     * @request POST:/v1/webhooks/stripe
     */
    stripeWebhookControllerHandleWebhook: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/webhooks/stripe`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags PaymentWebhook
     * @name PaymentWebhookControllerHandleWebhook
     * @request POST:/v1/webhooks/payments/{provider}
     */
    paymentWebhookControllerHandleWebhook: (
      provider: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/webhooks/payments/${provider}`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Payments
     * @name PaymentsControllerCreatePaymentIntent
     * @summary Create a payment intent for an order
     * @request POST:/v1/payments/intent
     * @secure
     */
    paymentsControllerCreatePaymentIntent: (
      data: CreatePaymentIntentDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/payments/intent`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags TestPayments
     * @name TestPaymentsControllerCreate
     * @request POST:/v1/test/payments
     */
    testPaymentsControllerCreate: (
      data: CreateTestPaymentDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/test/payments`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Invoices
     * @name InvoicesControllerList
     * @summary List SRI invoices
     * @request GET:/v1/invoices
     * @secure
     */
    invoicesControllerList: (
      query: {
        orderId?: string;
        status?:
          | "DRAFT"
          | "PENDING"
          | "SUBMITTED"
          | "AUTHORIZED"
          | "REJECTED"
          | "FAILED";
        from?: string;
        to?: string;
        limit: string;
        offset: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<InvoiceResponseDto[], any>({
        path: `/v1/invoices`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Invoices
     * @name InvoicesControllerIssueInvoice
     * @summary Issue an SRI invoice for a paid order
     * @request POST:/v1/invoices
     * @secure
     */
    invoicesControllerIssueInvoice: (
      data: IssueInvoiceDto,
      params: RequestParams = {},
    ) =>
      this.request<InvoiceResponseDto, void>({
        path: `/v1/invoices`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Invoices
     * @name InvoicesControllerFindById
     * @summary Get invoice detail
     * @request GET:/v1/invoices/{id}
     * @secure
     */
    invoicesControllerFindById: (id: string, params: RequestParams = {}) =>
      this.request<InvoiceResponseDto, void>({
        path: `/v1/invoices/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Invoices
     * @name InvoicesControllerRetry
     * @summary Retry a failed or rejected invoice
     * @request POST:/v1/invoices/{id}/retry
     * @secure
     */
    invoicesControllerRetry: (id: string, params: RequestParams = {}) =>
      this.request<InvoiceResponseDto, any>({
        path: `/v1/invoices/${id}/retry`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Invoices
     * @name InvoicesControllerDownloadXml
     * @summary Download signed invoice XML via signed URL
     * @request GET:/v1/invoices/{id}/xml
     * @secure
     */
    invoicesControllerDownloadXml: (id: string, params: RequestParams = {}) =>
      this.request<any, void>({
        path: `/v1/invoices/${id}/xml`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Invoices
     * @name InvoicesControllerDownloadPdf
     * @summary Download invoice RIDE PDF via signed URL
     * @request GET:/v1/invoices/{id}/pdf
     * @secure
     */
    invoicesControllerDownloadPdf: (id: string, params: RequestParams = {}) =>
      this.request<any, void>({
        path: `/v1/invoices/${id}/pdf`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Invoices
     * @name InvoicesControllerIssueCreditNote
     * @summary Issue an SRI credit note (04) for a return request
     * @request POST:/v1/invoices/credit-notes
     * @secure
     */
    invoicesControllerIssueCreditNote: (
      data: IssueCreditNoteDto,
      params: RequestParams = {},
    ) =>
      this.request<CreditNoteResponseDto, void>({
        path: `/v1/invoices/credit-notes`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Credit Notes
     * @name CreditNotesControllerList
     * @summary List SRI credit notes
     * @request GET:/v1/credit-notes
     * @secure
     */
    creditNotesControllerList: (
      query: {
        returnRequestId?: string;
        status?:
          | "DRAFT"
          | "PENDING"
          | "SUBMITTED"
          | "AUTHORIZED"
          | "REJECTED"
          | "FAILED";
        from?: string;
        to?: string;
        limit: string;
        offset: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<CreditNoteResponseDto[], any>({
        path: `/v1/credit-notes`,
        method: "GET",
        query: query,
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Credit Notes
     * @name CreditNotesControllerFindById
     * @summary Get credit note detail
     * @request GET:/v1/credit-notes/{id}
     * @secure
     */
    creditNotesControllerFindById: (id: string, params: RequestParams = {}) =>
      this.request<CreditNoteResponseDto, void>({
        path: `/v1/credit-notes/${id}`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Credit Notes
     * @name CreditNotesControllerRetry
     * @summary Retry a failed or rejected credit note
     * @request POST:/v1/credit-notes/{id}/retry
     * @secure
     */
    creditNotesControllerRetry: (id: string, params: RequestParams = {}) =>
      this.request<CreditNoteResponseDto, any>({
        path: `/v1/credit-notes/${id}/retry`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Credit Notes
     * @name CreditNotesControllerDownloadXml
     * @summary Download signed credit note XML via signed URL
     * @request GET:/v1/credit-notes/{id}/xml
     * @secure
     */
    creditNotesControllerDownloadXml: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<any, void>({
        path: `/v1/credit-notes/${id}/xml`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Credit Notes
     * @name CreditNotesControllerDownloadPdf
     * @summary Download credit note RIDE PDF via signed URL
     * @request GET:/v1/credit-notes/{id}/pdf
     * @secure
     */
    creditNotesControllerDownloadPdf: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<any, void>({
        path: `/v1/credit-notes/${id}/pdf`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Invoices — SRI Supplementary
     * @name SriSupplementaryControllerFindAll
     * @summary List SRI supplementary documents (05/06/07)
     * @request GET:/v1/invoices/sri/supplementary
     * @secure
     */
    sriSupplementaryControllerFindAll: (
      query: {
        documentType: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/invoices/sri/supplementary`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Invoices — SRI Supplementary
     * @name SriSupplementaryControllerIssue
     * @summary Issue SRI supplementary document 05/06/07
     * @request POST:/v1/invoices/sri/supplementary
     * @secure
     */
    sriSupplementaryControllerIssue: (
      data: IssueSupplementaryDocumentDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/invoices/sri/supplementary`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags TestInvoices
     * @name TestInvoicesControllerCreate
     * @request POST:/v1/test/invoices
     */
    testInvoicesControllerCreate: (
      data: CreateTestInvoiceDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/test/invoices`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags WhatsApp
     * @name WhatsAppControllerGetQuickReplies
     * @summary List active quick reply templates
     * @request GET:/v1/whatsapp/quick-replies
     * @secure
     */
    whatsAppControllerGetQuickReplies: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/whatsapp/quick-replies`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags WhatsApp
     * @name WhatsAppControllerCreateQuickReply
     * @summary Create a quick reply template
     * @request POST:/v1/whatsapp/quick-replies
     * @secure
     */
    whatsAppControllerCreateQuickReply: (
      data: CreateWhatsAppQuickReplyDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/whatsapp/quick-replies`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags WhatsApp
     * @name WhatsAppControllerListQuickRepliesAdmin
     * @summary List all quick reply templates (admin)
     * @request GET:/v1/whatsapp/quick-replies/admin
     * @secure
     */
    whatsAppControllerListQuickRepliesAdmin: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/whatsapp/quick-replies/admin`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags WhatsApp
     * @name WhatsAppControllerUpdateQuickReply
     * @summary Update a quick reply template
     * @request PATCH:/v1/whatsapp/quick-replies/{id}
     * @secure
     */
    whatsAppControllerUpdateQuickReply: (
      id: string,
      data: UpdateWhatsAppQuickReplyDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/whatsapp/quick-replies/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags WhatsApp
     * @name WhatsAppControllerDeleteQuickReply
     * @summary Delete a quick reply template
     * @request DELETE:/v1/whatsapp/quick-replies/{id}
     * @secure
     */
    whatsAppControllerDeleteQuickReply: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/whatsapp/quick-replies/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Conversations
     * @name ConversationControllerFindAll
     * @summary List conversations
     * @request GET:/v1/conversations
     */
    conversationControllerFindAll: (
      query?: {
        status?: "OPEN" | "PENDING" | "RESOLVED" | "CLOSED";
        assignedToMe?: string;
        search?: string;
        /** @default 1 */
        page?: number;
        /** @default 20 */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/conversations`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Conversations
     * @name ConversationControllerFindOne
     * @summary Get a conversation by id
     * @request GET:/v1/conversations/{id}
     */
    conversationControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/conversations/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Conversations
     * @name ConversationControllerUpdate
     * @summary Update conversation status or assigned agent
     * @request PATCH:/v1/conversations/{id}
     */
    conversationControllerUpdate: (
      id: string,
      data: UpdateConversationDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/conversations/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Messages
     * @name MessageControllerFindAll
     * @summary List messages for a conversation
     * @request GET:/v1/conversations/{conversationId}/messages
     */
    messageControllerFindAll: (
      conversationId: string,
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 20 */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/conversations/${conversationId}/messages`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Messages
     * @name MessageControllerCreate
     * @summary Send an outbound message in a conversation
     * @request POST:/v1/conversations/{conversationId}/messages
     */
    messageControllerCreate: (
      conversationId: string,
      data: CreateMessageDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/conversations/${conversationId}/messages`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Inventory
     * @name InventoryControllerCreate
     * @summary Create an inventory record
     * @request POST:/v1/inventory
     */
    inventoryControllerCreate: (
      data: CreateInventoryDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/inventory`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Inventory
     * @name InventoryControllerFindAll
     * @summary List all inventory records
     * @request GET:/v1/inventory
     */
    inventoryControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/inventory`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Inventory
     * @name InventoryControllerFindOne
     * @summary Get an inventory record by id
     * @request GET:/v1/inventory/{id}
     */
    inventoryControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/inventory/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Inventory
     * @name InventoryControllerUpdate
     * @summary Update an inventory record
     * @request PATCH:/v1/inventory/{id}
     */
    inventoryControllerUpdate: (
      id: string,
      data: UpdateInventoryDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/inventory/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Inventory
     * @name InventoryControllerRemove
     * @summary Delete an inventory record
     * @request DELETE:/v1/inventory/{id}
     */
    inventoryControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/inventory/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Inventory
     * @name InventoryControllerReserve
     * @summary Reserve stock units
     * @request POST:/v1/inventory/{id}/reserve
     */
    inventoryControllerReserve: (
      id: string,
      data: ReserveInventoryDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/inventory/${id}/reserve`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Inventory
     * @name InventoryControllerRelease
     * @summary Release reserved stock units
     * @request POST:/v1/inventory/{id}/release
     */
    inventoryControllerRelease: (
      id: string,
      data: ReserveInventoryDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/inventory/${id}/release`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name PushTokensControllerRegister
     * @summary Register or refresh an Expo push token for the current user
     * @request POST:/v1/notifications/push-tokens
     * @secure
     */
    pushTokensControllerRegister: (
      data: RegisterPushTokenDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/notifications/push-tokens`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name PushTokensControllerRemove
     * @summary Remove a push token for the current user
     * @request DELETE:/v1/notifications/push-tokens/{token}
     * @secure
     */
    pushTokensControllerRemove: (token: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/notifications/push-tokens/${token}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationPreferencesControllerGetPreferences
     * @summary Get notification consent preferences for the current user
     * @request GET:/v1/notifications/preferences
     * @secure
     */
    notificationPreferencesControllerGetPreferences: (
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/notifications/preferences`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationPreferencesControllerUpdatePreferences
     * @summary Update notification consent preferences
     * @request PATCH:/v1/notifications/preferences
     * @secure
     */
    notificationPreferencesControllerUpdatePreferences: (
      data: UpdateNotificationPreferencesDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/notifications/preferences`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationPreferencesControllerUnsubscribeGet
     * @summary One-click unsubscribe from email links (GET)
     * @request GET:/v1/notifications/unsubscribe
     */
    notificationPreferencesControllerUnsubscribeGet: (
      query: {
        token: string;
        scope: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/notifications/unsubscribe`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Notifications
     * @name NotificationPreferencesControllerUnsubscribe
     * @summary One-click unsubscribe using a signed token
     * @request POST:/v1/notifications/unsubscribe
     */
    notificationPreferencesControllerUnsubscribe: (
      query: {
        token: string;
        scope: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/notifications/unsubscribe`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Marketing
     * @name MarketingControllerListPromotions
     * @summary List active promotions for campaign targeting
     * @request GET:/v1/marketing/promotions
     * @secure
     */
    marketingControllerListPromotions: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/marketing/promotions`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Marketing
     * @name MarketingControllerDistributePromo
     * @summary Distribute promo codes to a customer segment
     * @request POST:/v1/marketing/campaigns/promo
     * @secure
     */
    marketingControllerDistributePromo: (
      data: DistributePromoDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/marketing/campaigns/promo`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerCreate
     * @request POST:/v1/users
     * @secure
     */
    usersControllerCreate: (data: CreateUserDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/users`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerFindAll
     * @request GET:/v1/users
     * @secure
     */
    usersControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/users`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerFindOne
     * @request GET:/v1/users/{id}
     * @secure
     */
    usersControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/users/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerUpdate
     * @request PATCH:/v1/users/{id}
     * @secure
     */
    usersControllerUpdate: (
      id: string,
      data: UpdateUserDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/users/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Users
     * @name UsersControllerRemove
     * @request DELETE:/v1/users/{id}
     * @secure
     */
    usersControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/users/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Health
     * @name HealthControllerCheck
     * @summary Check API health
     * @request GET:/v1/health
     */
    healthControllerCheck: (params: RequestParams = {}) =>
      this.request<
        {
          /** @example "ok" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        },
        {
          /** @example "error" */
          status?: string;
          /** @example {"database":{"status":"up"}} */
          info?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"redis":{"status":"down","message":"Could not connect"}} */
          error?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
          /** @example {"database":{"status":"up"},"redis":{"status":"down","message":"Could not connect"}} */
          details?: Record<
            string,
            {
              status: string;
              [key: string]: any;
            }
          >;
        }
      >({
        path: `/v1/health`,
        method: "GET",
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Categories
     * @name CategoriesControllerCreate
     * @summary Create a category
     * @request POST:/v1/categories
     */
    categoriesControllerCreate: (
      data: CreateCategoryDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/categories`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Categories
     * @name CategoriesControllerFindAll
     * @summary List all categories
     * @request GET:/v1/categories
     */
    categoriesControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/categories`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Categories
     * @name CategoriesControllerFindOne
     * @summary Get a category by id
     * @request GET:/v1/categories/{id}
     */
    categoriesControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/categories/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Categories
     * @name CategoriesControllerUpdate
     * @summary Update a category
     * @request PATCH:/v1/categories/{id}
     */
    categoriesControllerUpdate: (
      id: string,
      data: UpdateCategoryDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/categories/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Categories
     * @name CategoriesControllerRemove
     * @summary Delete a category
     * @request DELETE:/v1/categories/{id}
     */
    categoriesControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/categories/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Products
     * @name ProductsControllerCreate
     * @summary Create a product
     * @request POST:/v1/products
     */
    productsControllerCreate: (
      data: CreateProductDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/products`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Products
     * @name ProductsControllerFindAll
     * @summary List all products
     * @request GET:/v1/products
     */
    productsControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/products`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Products
     * @name ProductsControllerFindStoreProducts
     * @summary List active products for storefront (lean, paginated)
     * @request GET:/v1/products/store
     */
    productsControllerFindStoreProducts: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/products/store`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Products
     * @name ProductsControllerFindBySlug
     * @summary Get an active product by slug
     * @request GET:/v1/products/slug/{slug}
     */
    productsControllerFindBySlug: (slug: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/products/slug/${slug}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Products
     * @name ProductsControllerFindOne
     * @summary Get a product by id
     * @request GET:/v1/products/{id}
     */
    productsControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/products/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Products
     * @name ProductsControllerUpdate
     * @summary Update a product
     * @request PATCH:/v1/products/{id}
     */
    productsControllerUpdate: (
      id: string,
      data: UpdateProductDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/products/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Products
     * @name ProductsControllerRemove
     * @summary Delete a product
     * @request DELETE:/v1/products/{id}
     */
    productsControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/products/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Products
     * @name ProductsControllerSubscribeBackInStock
     * @summary Subscribe to back-in-stock email alerts for a product
     * @request POST:/v1/products/{id}/back-in-stock-alerts
     */
    productsControllerSubscribeBackInStock: (
      id: string,
      data: CreateBackInStockAlertDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/products/${id}/back-in-stock-alerts`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Knowledge
     * @name FaqControllerFindPublished
     * @summary List published FAQs
     * @request GET:/v1/ai/faqs
     */
    faqControllerFindPublished: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/ai/faqs`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Knowledge
     * @name FaqControllerCreate
     * @request POST:/v1/ai/faqs
     * @secure
     */
    faqControllerCreate: (data: CreateFaqDto, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/ai/faqs`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Knowledge
     * @name FaqControllerFindAll
     * @summary List all FAQs (admin)
     * @request GET:/v1/ai/faqs/admin
     * @secure
     */
    faqControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/ai/faqs/admin`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Knowledge
     * @name FaqControllerUpdate
     * @request PATCH:/v1/ai/faqs/{id}
     * @secure
     */
    faqControllerUpdate: (
      id: string,
      data: UpdateFaqDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/ai/faqs/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Knowledge
     * @name FaqControllerRemove
     * @request DELETE:/v1/ai/faqs/{id}
     * @secure
     */
    faqControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/ai/faqs/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Knowledge
     * @name CmsPageControllerFindBySlug
     * @summary Get published CMS page by slug
     * @request GET:/v1/ai/cms-pages/{slug}
     */
    cmsPageControllerFindBySlug: (slug: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/ai/cms-pages/${slug}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Knowledge
     * @name CmsPageControllerFindAll
     * @summary List CMS pages (admin)
     * @request GET:/v1/ai/cms-pages/admin/list
     * @secure
     */
    cmsPageControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/ai/cms-pages/admin/list`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Knowledge
     * @name CmsPageControllerCreate
     * @request POST:/v1/ai/cms-pages
     * @secure
     */
    cmsPageControllerCreate: (
      data: CreateCmsPageDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/ai/cms-pages`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Knowledge
     * @name CmsPageControllerUpdate
     * @request PATCH:/v1/ai/cms-pages/{id}
     * @secure
     */
    cmsPageControllerUpdate: (
      id: string,
      data: UpdateCmsPageDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/ai/cms-pages/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Knowledge
     * @name CmsPageControllerRemove
     * @request DELETE:/v1/ai/cms-pages/{id}
     * @secure
     */
    cmsPageControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/ai/cms-pages/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerCreateSession
     * @summary Create a web chat session
     * @request POST:/v1/chat/sessions
     */
    chatControllerCreateSession: (
      data: CreateChatSessionDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/chat/sessions`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerSendMessage
     * @summary Send a message in a web chat session
     * @request POST:/v1/chat/sessions/{sessionId}/messages
     */
    chatControllerSendMessage: (
      sessionId: string,
      data: SendChatMessageDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/chat/sessions/${sessionId}/messages`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Chat
     * @name ChatControllerListMessages
     * @summary List messages for a web chat session
     * @request GET:/v1/chat/sessions/{sessionId}/messages
     */
    chatControllerListMessages: (
      sessionId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/chat/sessions/${sessionId}/messages`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Search
     * @name SearchControllerSearch
     * @summary Hybrid product search (keyword + optional semantic)
     * @request GET:/v1/search
     */
    searchControllerSearch: (
      query: {
        q: string;
        limit: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/search`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Search Admin
     * @name SearchAdminControllerReindex
     * @summary Rebuild Meilisearch product index from Prisma
     * @request POST:/v1/search/admin/reindex
     */
    searchAdminControllerReindex: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/search/admin/reindex`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Product Content
     * @name ProductContentAiControllerGenerate
     * @summary Generate AI product content draft
     * @request POST:/v1/ai/products/{id}/generate-content
     * @secure
     */
    productContentAiControllerGenerate: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/ai/products/${id}/generate-content`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Product Content
     * @name ProductContentAiControllerGetDraft
     * @request GET:/v1/ai/products/{id}/content-draft
     * @secure
     */
    productContentAiControllerGetDraft: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/ai/products/${id}/content-draft`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Product Content
     * @name ProductContentAiControllerApprove
     * @request POST:/v1/ai/products/{id}/content-draft/approve
     * @secure
     */
    productContentAiControllerApprove: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/ai/products/${id}/content-draft/approve`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags AI Product Content
     * @name ProductContentAiControllerReject
     * @request POST:/v1/ai/products/{id}/content-draft/reject
     * @secure
     */
    productContentAiControllerReject: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/ai/products/${id}/content-draft/reject`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Suppliers
     * @name SuppliersControllerCreate
     * @summary Create a supplier
     * @request POST:/v1/suppliers
     */
    suppliersControllerCreate: (
      data: CreateSupplierDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/suppliers`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Suppliers
     * @name SuppliersControllerFindAll
     * @summary List all suppliers
     * @request GET:/v1/suppliers
     */
    suppliersControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/suppliers`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Suppliers
     * @name SuppliersControllerFindOne
     * @summary Get a supplier by id
     * @request GET:/v1/suppliers/{id}
     */
    suppliersControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/suppliers/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Suppliers
     * @name SuppliersControllerUpdate
     * @summary Update a supplier
     * @request PATCH:/v1/suppliers/{id}
     */
    suppliersControllerUpdate: (
      id: string,
      data: UpdateSupplierDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/suppliers/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Suppliers
     * @name SuppliersControllerRemove
     * @summary Delete a supplier
     * @request DELETE:/v1/suppliers/{id}
     */
    suppliersControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/suppliers/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Cart
     * @name CartControllerFindOne
     * @summary Get a cart (placeholder)
     * @request GET:/v1/cart/{id}
     */
    cartControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/cart/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Cart
     * @name CartControllerAddItem
     * @summary Add item to cart (placeholder)
     * @request POST:/v1/cart/items
     */
    cartControllerAddItem: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/cart/items`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Cart
     * @name CartControllerRemoveItem
     * @summary Remove item from cart (placeholder)
     * @request DELETE:/v1/cart/items/{id}
     */
    cartControllerRemoveItem: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/cart/items/${id}`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrdersControllerCreate
     * @summary Create a new order
     * @request POST:/v1/orders
     */
    ordersControllerCreate: (
      data: CreateOrderDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/orders`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrdersControllerListOrders
     * @summary List orders (admin)
     * @request GET:/v1/orders
     * @secure
     */
    ordersControllerListOrders: (
      query?: {
        /** @default 1 */
        page?: number;
        /** @default 50 */
        limit?: number;
        status?:
          | "PENDING"
          | "PAYMENT_PENDING"
          | "PROCESSING"
          | "READY_FOR_PICKUP"
          | "PARTIALLY_SHIPPED"
          | "SHIPPED"
          | "DELIVERED"
          | "CANCELLED"
          | "REFUNDED"
          | "PAYMENT_FAILED"
          | "PARTIALLY_REFUNDED";
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/orders`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrdersControllerGetTracking
     * @summary Get public order tracking
     * @request GET:/v1/orders/{id}/tracking
     */
    ordersControllerGetTracking: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/orders/${id}/tracking`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrdersControllerGetOrderById
     * @summary Get an order by id
     * @request GET:/v1/orders/{id}
     * @secure
     */
    ordersControllerGetOrderById: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/orders/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrdersControllerUpdateOrderStatus
     * @summary Update order status (admin)
     * @request PATCH:/v1/orders/{id}/status
     * @secure
     */
    ordersControllerUpdateOrderStatus: (
      id: string,
      data: UpdateOrderStatusDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/orders/${id}/status`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrdersControllerMarkPickupReady
     * @summary Mark BOPIS order ready for pickup
     * @request POST:/v1/orders/{id}/pickup/ready
     * @secure
     */
    ordersControllerMarkPickupReady: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/orders/${id}/pickup/ready`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrdersControllerConfirmPickup
     * @summary Confirm BOPIS pickup completed
     * @request POST:/v1/orders/{id}/pickup/confirm
     * @secure
     */
    ordersControllerConfirmPickup: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/orders/${id}/pickup/confirm`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrdersControllerCancelOrder
     * @summary Cancel an order
     * @request POST:/v1/orders/{id}/cancel
     */
    ordersControllerCancelOrder: (
      id: string,
      data: CancelOrderDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/orders/${id}/cancel`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrdersControllerCreateRefund
     * @summary Create a refund for an order (admin/finance)
     * @request POST:/v1/orders/{id}/refunds
     * @secure
     */
    ordersControllerCreateRefund: (
      id: string,
      data: CreateRefundDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/orders/${id}/refunds`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrdersControllerListRefunds
     * @summary List refunds for an order
     * @request GET:/v1/orders/{id}/refunds
     * @secure
     */
    ordersControllerListRefunds: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/orders/${id}/refunds`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrdersControllerGenerateReceipt
     * @summary Generate a receipt for an order (admin)
     * @request POST:/v1/orders/{id}/receipt
     * @secure
     */
    ordersControllerGenerateReceipt: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/orders/${id}/receipt`,
        method: "POST",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Orders
     * @name OrdersControllerGetReceipt
     * @summary Get a receipt for an order
     * @request GET:/v1/orders/{id}/receipt
     * @secure
     */
    ordersControllerGetReceipt: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/orders/${id}/receipt`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Refunds
     * @name RefundsControllerApproveRefund
     * @summary Approve a pending refund (admin/finance)
     * @request PATCH:/v1/refunds/{id}/approve
     * @secure
     */
    refundsControllerApproveRefund: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/refunds/${id}/approve`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Shipping
     * @name ShippingControllerQuote
     * @summary Quote shipping for a cart subtotal and destination
     * @request POST:/v1/shipping/quote
     */
    shippingControllerQuote: (
      data: ShippingQuoteDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/shipping/quote`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Shipping
     * @name ShippingControllerListZones
     * @summary List active shipping zones (admin)
     * @request GET:/v1/shipping/zones
     */
    shippingControllerListZones: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/shipping/zones`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Loyalty
     * @name LoyaltyControllerMe
     * @summary Get current user loyalty account
     * @request GET:/v1/loyalty/me
     */
    loyaltyControllerMe: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/loyalty/me`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Loyalty
     * @name LoyaltyControllerTransactions
     * @summary List loyalty transactions
     * @request GET:/v1/loyalty/me/transactions
     */
    loyaltyControllerTransactions: (
      query: {
        limit: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/loyalty/me/transactions`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Loyalty
     * @name LoyaltyControllerQuote
     * @summary Quote loyalty redemption for checkout
     * @request GET:/v1/loyalty/me/redemption-quote
     */
    loyaltyControllerQuote: (
      query: {
        subtotal: string;
        points: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/loyalty/me/redemption-quote`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Returns
     * @name OrderReturnsControllerCreateReturnForOrder
     * @summary Create a return request for an order (customer)
     * @request POST:/v1/orders/{id}/returns
     * @secure
     */
    orderReturnsControllerCreateReturnForOrder: (
      id: string,
      data: CreateReturnDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/orders/${id}/returns`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Returns
     * @name ReturnsControllerCreateGuestReturn
     * @summary Create a return request as a guest using order id + email
     * @request POST:/v1/returns/guest/request
     * @secure
     */
    returnsControllerCreateGuestReturn: (
      data: CreateGuestReturnRequestDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/returns/guest/request`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Returns
     * @name ReturnsControllerListReturns
     * @summary List return requests (admin)
     * @request GET:/v1/returns
     * @secure
     */
    returnsControllerListReturns: (
      query?: {
        status?:
          | "REQUESTED"
          | "APPROVED"
          | "REJECTED"
          | "INSPECTION"
          | "RESOLVED"
          | "RESOLUTION_PENDING_CREDIT_NOTE"
          | "CLOSED";
        orderId?: string;
        userId?: string;
        customerEmail?: string;
        limit?: string;
        offset?: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/returns`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Returns
     * @name ReturnsControllerMyStoreCredit
     * @summary Get the current customer store-credit balance
     * @request GET:/v1/returns/store-credit/me
     * @secure
     */
    returnsControllerMyStoreCredit: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/returns/store-credit/me`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Returns
     * @name ReturnsControllerGetReturn
     * @summary Get a return request by id (admin or owner)
     * @request GET:/v1/returns/{id}
     * @secure
     */
    returnsControllerGetReturn: (id: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/returns/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Returns
     * @name ReturnsControllerUpdateReturnShipping
     * @summary Update return reverse-logistics tracking (admin)
     * @request PATCH:/v1/returns/{id}/shipping
     * @secure
     */
    returnsControllerUpdateReturnShipping: (
      id: string,
      data: UpdateReturnShippingDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/returns/${id}/shipping`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Returns
     * @name ReturnsControllerUpdateStatus
     * @summary Update return request status (admin)
     * @request PATCH:/v1/returns/{id}/status
     * @secure
     */
    returnsControllerUpdateStatus: (
      id: string,
      data: UpdateReturnStatusDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/returns/${id}/status`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Returns
     * @name ReturnsControllerResolveReturn
     * @summary Resolve a return request (admin)
     * @request POST:/v1/returns/{id}/resolve
     * @secure
     */
    returnsControllerResolveReturn: (
      id: string,
      data: ResolveReturnDto,
      params: RequestParams = {},
    ) =>
      this.request<void, void>({
        path: `/v1/returns/${id}/resolve`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Webhooks
     * @name WebhookControllerHandle
     * @summary Receive Evolution API webhook events
     * @request POST:/v1/webhooks/evolution/{event}
     */
    webhookControllerHandle: (event: string, params: RequestParams = {}) =>
      this.request<void, void>({
        path: `/v1/webhooks/evolution/${event}`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Webhooks
     * @name WmsWebhookControllerInventoryWebhook
     * @summary WMS inventory sync webhook
     * @request POST:/v1/webhooks/wms/{provider}/inventory
     */
    wmsWebhookControllerInventoryWebhook: (
      provider: string,
      data: WmsSyncInventoryDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/webhooks/wms/${provider}/inventory`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Webhooks
     * @name WmsWebhookControllerTrackingWebhook
     * @summary WMS tracking events webhook
     * @request POST:/v1/webhooks/wms/{provider}/tracking
     */
    wmsWebhookControllerTrackingWebhook: (
      provider: string,
      data: WmsImportTrackingDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/webhooks/wms/${provider}/tracking`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Fulfillment
     * @name FulfillmentControllerCreateShipment
     * @summary Create a shipment for an order (admin)
     * @request POST:/v1/fulfillment/orders/{orderId}/shipments
     * @secure
     */
    fulfillmentControllerCreateShipment: (
      orderId: string,
      data: CreateShipmentDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/fulfillment/orders/${orderId}/shipments`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Fulfillment
     * @name FulfillmentControllerListShipments
     * @summary List shipments for an order
     * @request GET:/v1/fulfillment/orders/{orderId}/shipments
     * @secure
     */
    fulfillmentControllerListShipments: (
      orderId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/fulfillment/orders/${orderId}/shipments`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Fulfillment
     * @name FulfillmentControllerListAllShipments
     * @summary List all shipments (admin)
     * @request GET:/v1/fulfillment/shipments
     * @secure
     */
    fulfillmentControllerListAllShipments: (
      query?: {
        status?:
          | "PENDING"
          | "LABEL_CREATED"
          | "IN_TRANSIT"
          | "DELIVERED"
          | "RETURNED"
          | "CANCELLED";
        /** @default 50 */
        limit?: number;
        /** @default 0 */
        offset?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/fulfillment/shipments`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Fulfillment
     * @name FulfillmentControllerMarkDelivered
     * @summary Mark a shipment as delivered
     * @request PATCH:/v1/fulfillment/shipments/{shipmentId}/delivered
     * @secure
     */
    fulfillmentControllerMarkDelivered: (
      shipmentId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/fulfillment/shipments/${shipmentId}/delivered`,
        method: "PATCH",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Fulfillment
     * @name FulfillmentControllerPrintLabel
     * @summary Printable shipping label HTML
     * @request GET:/v1/fulfillment/shipments/{shipmentId}/label
     * @secure
     */
    fulfillmentControllerPrintLabel: (
      shipmentId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/fulfillment/shipments/${shipmentId}/label`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Fulfillment
     * @name FulfillmentControllerGetTracking
     * @summary Public order tracking by order id
     * @request GET:/v1/fulfillment/orders/{orderId}/tracking
     */
    fulfillmentControllerGetTracking: (
      orderId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/fulfillment/orders/${orderId}/tracking`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Fulfillment
     * @name FulfillmentControllerListWmsProviders
     * @summary List evaluated WMS/3PL providers
     * @request GET:/v1/fulfillment/wms/providers
     * @secure
     */
    fulfillmentControllerListWmsProviders: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/fulfillment/wms/providers`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Fulfillment
     * @name FulfillmentControllerSyncInventory
     * @summary Sync inventory levels from WMS payload
     * @request POST:/v1/fulfillment/wms/sync-inventory
     * @secure
     */
    fulfillmentControllerSyncInventory: (
      data: WmsSyncInventoryDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/fulfillment/wms/sync-inventory`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Fulfillment
     * @name FulfillmentControllerImportTracking
     * @summary Import tracking events from WMS/3PL
     * @request POST:/v1/fulfillment/wms/import-tracking
     * @secure
     */
    fulfillmentControllerImportTracking: (
      data: WmsImportTrackingDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/fulfillment/wms/import-tracking`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Fulfillment
     * @name FulfillmentControllerListBackorders
     * @summary List open backorder lines
     * @request GET:/v1/fulfillment/backorders
     * @secure
     */
    fulfillmentControllerListBackorders: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/fulfillment/backorders`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Incomes
     * @name IncomesControllerCreate
     * @summary Create an income record
     * @request POST:/v1/finance/incomes
     * @secure
     */
    incomesControllerCreate: (
      data: CreateIncomeDto,
      params: RequestParams = {},
    ) =>
      this.request<IncomeResponseDto, any>({
        path: `/v1/finance/incomes`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Incomes
     * @name IncomesControllerFindAll
     * @summary List income records
     * @request GET:/v1/finance/incomes
     * @secure
     */
    incomesControllerFindAll: (
      query: {
        source?: "ORDER" | "INVESTMENT" | "OTHER";
        from?: string;
        to?: string;
        relatedOrderId?: string;
        limit: string;
        offset: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/incomes`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Incomes
     * @name IncomesControllerFindOne
     * @summary Get income by id
     * @request GET:/v1/finance/incomes/{id}
     * @secure
     */
    incomesControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/finance/incomes/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Incomes
     * @name IncomesControllerUpdate
     * @summary Update an income record
     * @request PATCH:/v1/finance/incomes/{id}
     * @secure
     */
    incomesControllerUpdate: (
      id: string,
      data: UpdateIncomeDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/incomes/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Incomes
     * @name IncomesControllerRemove
     * @summary Delete an income record
     * @request DELETE:/v1/finance/incomes/{id}
     * @secure
     */
    incomesControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/finance/incomes/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Expense Categories
     * @name ExpenseCategoriesControllerCreate
     * @summary Create an expense category
     * @request POST:/v1/finance/expense-categories
     * @secure
     */
    expenseCategoriesControllerCreate: (
      data: CreateExpenseCategoryDto,
      params: RequestParams = {},
    ) =>
      this.request<ExpenseCategoryResponseDto, any>({
        path: `/v1/finance/expense-categories`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Expense Categories
     * @name ExpenseCategoriesControllerFindAll
     * @summary List expense categories
     * @request GET:/v1/finance/expense-categories
     * @secure
     */
    expenseCategoriesControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/finance/expense-categories`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Expense Categories
     * @name ExpenseCategoriesControllerFindOne
     * @summary Get expense category by id
     * @request GET:/v1/finance/expense-categories/{id}
     * @secure
     */
    expenseCategoriesControllerFindOne: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/expense-categories/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Expense Categories
     * @name ExpenseCategoriesControllerUpdate
     * @summary Update an expense category
     * @request PATCH:/v1/finance/expense-categories/{id}
     * @secure
     */
    expenseCategoriesControllerUpdate: (
      id: string,
      data: UpdateExpenseCategoryDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/expense-categories/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Expense Categories
     * @name ExpenseCategoriesControllerRemove
     * @summary Delete an expense category
     * @request DELETE:/v1/finance/expense-categories/{id}
     * @secure
     */
    expenseCategoriesControllerRemove: (
      id: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/expense-categories/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Expenses
     * @name ExpensesControllerCreate
     * @request POST:/v1/finance/expenses
     * @secure
     */
    expensesControllerCreate: (
      data: CreateExpenseDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/expenses`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Expenses
     * @name ExpensesControllerFindAll
     * @request GET:/v1/finance/expenses
     * @secure
     */
    expensesControllerFindAll: (
      query: {
        categoryId: string;
        supplierId: string;
        status?: "PENDING" | "PAID" | "CANCELLED";
        from: string;
        to: string;
        limit: string;
        offset: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/expenses`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Expenses
     * @name ExpensesControllerFindOne
     * @request GET:/v1/finance/expenses/{id}
     * @secure
     */
    expensesControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/finance/expenses/${id}`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Expenses
     * @name ExpensesControllerUpdate
     * @request PATCH:/v1/finance/expenses/{id}
     * @secure
     */
    expensesControllerUpdate: (
      id: string,
      data: UpdateExpenseDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/expenses/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Expenses
     * @name ExpensesControllerRemove
     * @request DELETE:/v1/finance/expenses/{id}
     * @secure
     */
    expensesControllerRemove: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/finance/expenses/${id}`,
        method: "DELETE",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Expenses
     * @name ExpensesControllerUploadReceipt
     * @summary Upload an expense receipt to S3
     * @request POST:/v1/finance/expenses/{id}/receipts
     * @secure
     */
    expensesControllerUploadReceipt: (
      id: string,
      data: UploadExpenseReceiptDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/expenses/${id}/receipts`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Expenses
     * @name ExpensesControllerDownloadReceipt
     * @summary Redirect to signed receipt URL
     * @request GET:/v1/finance/expenses/{id}/receipts/download
     * @secure
     */
    expensesControllerDownloadReceipt: (
      id: string,
      query: {
        key: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/expenses/${id}/receipts/download`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Reports
     * @name FinanceReportsControllerGetCashFlow
     * @summary Cash-flow report for a date range
     * @request GET:/v1/finance/reports/cash-flow
     * @secure
     */
    financeReportsControllerGetCashFlow: (
      query: {
        from: string;
        to: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/reports/cash-flow`,
        method: "GET",
        query: query,
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Store Credits
     * @name FinanceStoreCreditsControllerFindAll
     * @summary List store credit balances
     * @request GET:/v1/finance/store-credits
     * @secure
     */
    financeStoreCreditsControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/finance/store-credits`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Store Credits
     * @name FinanceStoreCreditsControllerIssue
     * @summary Issue store credit to a user
     * @request POST:/v1/finance/store-credits
     * @secure
     */
    financeStoreCreditsControllerIssue: (
      data: IssueStoreCreditDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/store-credits`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Store Credits
     * @name FinanceStoreCreditsControllerUpdate
     * @summary Adjust store credit balance or expiry
     * @request PATCH:/v1/finance/store-credits/{id}
     * @secure
     */
    financeStoreCreditsControllerUpdate: (
      id: string,
      data: UpdateStoreCreditDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/store-credits/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Gift Cards
     * @name FinanceGiftCardsControllerFindAll
     * @summary List gift cards
     * @request GET:/v1/finance/gift-cards
     * @secure
     */
    financeGiftCardsControllerFindAll: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/finance/gift-cards`,
        method: "GET",
        secure: true,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Gift Cards
     * @name FinanceGiftCardsControllerCreate
     * @summary Create a gift card
     * @request POST:/v1/finance/gift-cards
     * @secure
     */
    financeGiftCardsControllerCreate: (
      data: CreateGiftCardDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/gift-cards`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Finance — Gift Cards
     * @name FinanceGiftCardsControllerUpdate
     * @summary Update gift card balance or status
     * @request PATCH:/v1/finance/gift-cards/{id}
     * @secure
     */
    financeGiftCardsControllerUpdate: (
      id: string,
      data: UpdateGiftCardDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/finance/gift-cards/${id}`,
        method: "PATCH",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Analytics
     * @name AnalyticsControllerTrackEvent
     * @summary Ingest client analytics event
     * @request POST:/v1/analytics/events
     */
    analyticsControllerTrackEvent: (
      data: TrackAnalyticsEventDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/analytics/events`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Analytics
     * @name AnalyticsControllerReportError
     * @summary Report client-side error
     * @request POST:/v1/analytics/errors
     */
    analyticsControllerReportError: (
      data: ReportClientErrorDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/analytics/errors`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Analytics
     * @name AnalyticsControllerGetOverview
     * @summary Analytics overview report
     * @request GET:/v1/analytics/overview
     */
    analyticsControllerGetOverview: (
      query: {
        days: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/analytics/overview`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Analytics
     * @name AnalyticsControllerGetFunnel
     * @summary Funnel step counts
     * @request GET:/v1/analytics/funnel
     */
    analyticsControllerGetFunnel: (
      query: {
        days: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/analytics/funnel`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Analytics
     * @name AnalyticsControllerGetCohorts
     * @summary Weekly cohort retention report
     * @request GET:/v1/analytics/cohorts
     */
    analyticsControllerGetCohorts: (
      query: {
        weeks: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/analytics/cohorts`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Analytics
     * @name AnalyticsControllerCheckFeatureFlag
     * @summary Check feature flag (PostHog)
     * @request GET:/v1/analytics/feature-flags/{flag}
     */
    analyticsControllerCheckFeatureFlag: (
      flag: string,
      query: {
        distinctId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/analytics/feature-flags/${flag}`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Catalog
     * @name CatalogControllerBrowse
     * @summary Browse catalog with filters, facets, and pagination
     * @request GET:/v1/catalog
     */
    catalogControllerBrowse: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/catalog`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name ReviewsControllerExternalSummary
     * @summary External store review summary (Google/Trustpilot stub)
     * @request GET:/v1/reviews/external/summary
     */
    reviewsControllerExternalSummary: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/reviews/external/summary`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name ReviewsControllerListByProduct
     * @summary List approved reviews for a product
     * @request GET:/v1/reviews/products/{productId}
     */
    reviewsControllerListByProduct: (
      productId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/reviews/products/${productId}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name ReviewsControllerCreate
     * @summary Submit a product review
     * @request POST:/v1/reviews/products/{productId}
     */
    reviewsControllerCreate: (
      productId: string,
      data: CreateProductReviewDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/reviews/products/${productId}`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name ReviewsControllerSummary
     * @summary Product review aggregate summary
     * @request GET:/v1/reviews/products/{productId}/summary
     */
    reviewsControllerSummary: (productId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/reviews/products/${productId}/summary`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name ReviewsControllerListPending
     * @summary List pending reviews for moderation
     * @request GET:/v1/reviews/moderation/pending
     */
    reviewsControllerListPending: (
      query: {
        limit: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/reviews/moderation/pending`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Reviews
     * @name ReviewsControllerModerate
     * @summary Approve or reject a review
     * @request PATCH:/v1/reviews/{id}/status
     */
    reviewsControllerModerate: (
      id: string,
      data: UpdateReviewStatusDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/reviews/${id}/status`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Referrals
     * @name ReferralsControllerMyCode
     * @summary Get or create referral code for current user
     * @request GET:/v1/referrals/me/code
     */
    referralsControllerMyCode: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/referrals/me/code`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Referrals
     * @name ReferralsControllerMyPerformance
     * @summary Referral performance for current user
     * @request GET:/v1/referrals/me/performance
     */
    referralsControllerMyPerformance: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/referrals/me/performance`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Referrals
     * @name ReferralsControllerAdminPerformance
     * @summary Referral performance dashboard
     * @request GET:/v1/referrals/admin/performance
     */
    referralsControllerAdminPerformance: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/referrals/admin/performance`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Referrals
     * @name ReferralsControllerPayout
     * @summary Pay referral commission
     * @request POST:/v1/referrals/admin/conversions/{id}/payout
     */
    referralsControllerPayout: (
      id: string,
      data: PayoutReferralDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/referrals/admin/conversions/${id}/payout`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags B2B
     * @name B2BControllerListCompanies
     * @summary List B2B companies
     * @request GET:/v1/b2b/companies
     */
    b2BControllerListCompanies: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/b2b/companies`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags B2B
     * @name B2BControllerCreateCompany
     * @request POST:/v1/b2b/companies
     */
    b2BControllerCreateCompany: (
      data: CreateCompanyDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/b2b/companies`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags B2B
     * @name B2BControllerUpdateCompany
     * @request PATCH:/v1/b2b/companies/{id}
     */
    b2BControllerUpdateCompany: (
      id: string,
      data: UpdateCompanyDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/b2b/companies/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags B2B
     * @name B2BControllerAddUser
     * @request POST:/v1/b2b/companies/{id}/users
     */
    b2BControllerAddUser: (
      id: string,
      data: AddCompanyUserDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/b2b/companies/${id}/users`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags B2B
     * @name B2BControllerListPrices
     * @request GET:/v1/b2b/companies/{id}/prices
     */
    b2BControllerListPrices: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/b2b/companies/${id}/prices`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags B2B
     * @name B2BControllerUpsertPrice
     * @request POST:/v1/b2b/companies/{id}/prices
     */
    b2BControllerUpsertPrice: (
      id: string,
      data: UpsertCompanyPriceDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/b2b/companies/${id}/prices`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags B2B
     * @name B2BControllerBulkImport
     * @request POST:/v1/b2b/companies/{id}/bulk-orders
     */
    b2BControllerBulkImport: (
      id: string,
      data: BulkOrderImportDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/b2b/companies/${id}/bulk-orders`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags B2B
     * @name B2BControllerMyCompany
     * @summary Get current user B2B company membership
     * @request GET:/v1/b2b/me/company
     */
    b2BControllerMyCompany: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/b2b/me/company`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes
     * @name QuotesControllerCreate
     * @summary Request a B2B quote
     * @request POST:/v1/quotes
     */
    quotesControllerCreate: (
      data: CreateQuoteDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/quotes`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes
     * @name QuotesControllerMine
     * @summary List my quote requests
     * @request GET:/v1/quotes/me
     */
    quotesControllerMine: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/quotes/me`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes
     * @name QuotesControllerAdminList
     * @request GET:/v1/quotes/admin
     */
    quotesControllerAdminList: (
      query: {
        status: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/quotes/admin`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes
     * @name QuotesControllerFindOne
     * @summary Get quote by id
     * @request GET:/v1/quotes/{id}
     */
    quotesControllerFindOne: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/quotes/${id}`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes
     * @name QuotesControllerUpdateStatus
     * @request PATCH:/v1/quotes/{id}/status
     */
    quotesControllerUpdateStatus: (
      id: string,
      data: UpdateQuoteStatusDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/quotes/${id}/status`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Quotes
     * @name QuotesControllerConvert
     * @summary Convert approved quote to order
     * @request POST:/v1/quotes/{id}/convert
     */
    quotesControllerConvert: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/quotes/${id}/convert`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Marketplace
     * @name MarketplaceControllerChannels
     * @summary List marketplace channel profiles
     * @request GET:/v1/marketplace/channels
     */
    marketplaceControllerChannels: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/marketplace/channels`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Marketplace
     * @name MarketplaceControllerListings
     * @request GET:/v1/marketplace/listings
     */
    marketplaceControllerListings: (
      query: {
        channel: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/marketplace/listings`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Marketplace
     * @name MarketplaceControllerSyncProduct
     * @request POST:/v1/marketplace/products/{productId}/sync
     */
    marketplaceControllerSyncProduct: (
      productId: string,
      query: {
        channel: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/marketplace/products/${productId}/sync`,
        method: "POST",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Marketplace
     * @name MarketplaceControllerImportOrder
     * @request POST:/v1/marketplace/orders/import
     */
    marketplaceControllerImportOrder: (
      data: MarketplaceImportOrderDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/marketplace/orders/import`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Accounting
     * @name AccountingControllerProviders
     * @summary List accounting provider profiles
     * @request GET:/v1/accounting/providers
     */
    accountingControllerProviders: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/accounting/providers`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Accounting
     * @name AccountingControllerSyncRecords
     * @request GET:/v1/accounting/sync-records
     */
    accountingControllerSyncRecords: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/accounting/sync-records`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Accounting
     * @name AccountingControllerSyncInvoice
     * @summary Push authorized invoice to accounting provider
     * @request POST:/v1/accounting/invoices/{id}/sync
     */
    accountingControllerSyncInvoice: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/accounting/invoices/${id}/sync`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Accounting
     * @name AccountingControllerMarketplaceFees
     * @summary List marketplace fee reconciliations
     * @request GET:/v1/accounting/marketplace-fees
     */
    accountingControllerMarketplaceFees: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/accounting/marketplace-fees`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Accounting
     * @name AccountingControllerSyncMarketplaceFee
     * @summary Push marketplace fees to accounting provider
     * @request POST:/v1/accounting/marketplace-fees/{orderId}/sync
     */
    accountingControllerSyncMarketplaceFee: (
      orderId: string,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/accounting/marketplace-fees/${orderId}/sync`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Privacy
     * @name PrivacyControllerExportMine
     * @summary Export personal data (GDPR)
     * @request GET:/v1/privacy/me/export
     */
    privacyControllerExportMine: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/privacy/me/export`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Privacy
     * @name PrivacyControllerDeleteMine
     * @summary Request account data deletion / anonymization (GDPR)
     * @request DELETE:/v1/privacy/me
     */
    privacyControllerDeleteMine: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/privacy/me`,
        method: "DELETE",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Privacy
     * @name PrivacyControllerCcpaOptOut
     * @summary CCPA do-not-sell / share preference
     * @request PATCH:/v1/privacy/me/ccpa-opt-out
     */
    privacyControllerCcpaOptOut: (
      data: UpdateCcpaOptOutDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/privacy/me/ccpa-opt-out`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags POS
     * @name PosControllerListLocations
     * @summary List active store locations (optionally pickup only)
     * @request GET:/v1/pos/locations
     */
    posControllerListLocations: (
      query: {
        pickup: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/pos/locations`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags POS
     * @name PosControllerCreateLocation
     * @request POST:/v1/pos/locations
     */
    posControllerCreateLocation: (
      data: CreateStoreLocationDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/pos/locations`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags POS
     * @name PosControllerUpdateLocation
     * @request PATCH:/v1/pos/locations/{id}
     */
    posControllerUpdateLocation: (
      id: string,
      data: UpdateStoreLocationDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/pos/locations/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags POS
     * @name PosControllerListRegisters
     * @request GET:/v1/pos/registers
     */
    posControllerListRegisters: (
      query: {
        locationId: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/pos/registers`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags POS
     * @name PosControllerCreateRegister
     * @request POST:/v1/pos/registers
     */
    posControllerCreateRegister: (
      data: CreatePosRegisterDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/pos/registers`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags POS
     * @name PosControllerUpdateRegister
     * @request PATCH:/v1/pos/registers/{id}
     */
    posControllerUpdateRegister: (
      id: string,
      data: UpdatePosRegisterDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/pos/registers/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags POS
     * @name PosControllerCloseRegister
     * @request POST:/v1/pos/registers/{id}/close
     */
    posControllerCloseRegister: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/pos/registers/${id}/close`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags POS
     * @name PosControllerCreatePosOrder
     * @request POST:/v1/pos/orders
     */
    posControllerCreatePosOrder: (
      data: CreatePosOrderDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/pos/orders`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags POS
     * @name PosControllerCompleteCash
     * @request POST:/v1/pos/orders/{id}/complete-cash
     */
    posControllerCompleteCash: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/pos/orders/${id}/complete-cash`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subscriptions
     * @name SubscriptionsControllerListPlans
     * @summary List subscription plans
     * @request GET:/v1/subscriptions/plans
     */
    subscriptionsControllerListPlans: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/subscriptions/plans`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subscriptions
     * @name SubscriptionsControllerCreatePlan
     * @request POST:/v1/subscriptions/plans
     */
    subscriptionsControllerCreatePlan: (
      data: CreateSubscriptionPlanDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/subscriptions/plans`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subscriptions
     * @name SubscriptionsControllerUpdatePlan
     * @request PATCH:/v1/subscriptions/plans/{id}
     */
    subscriptionsControllerUpdatePlan: (
      id: string,
      data: UpdateSubscriptionPlanDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/subscriptions/plans/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subscriptions
     * @name SubscriptionsControllerMySubscriptions
     * @summary List my subscriptions
     * @request GET:/v1/subscriptions/me
     */
    subscriptionsControllerMySubscriptions: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/subscriptions/me`,
        method: "GET",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subscriptions
     * @name SubscriptionsControllerSubscribe
     * @summary Start Stripe subscription checkout
     * @request POST:/v1/subscriptions/subscribe
     */
    subscriptionsControllerSubscribe: (
      data: SubscribeDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/subscriptions/subscribe`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Subscriptions
     * @name SubscriptionsControllerPortal
     * @summary Stripe customer billing portal (pause/cancel/upgrade)
     * @request POST:/v1/subscriptions/portal
     */
    subscriptionsControllerPortal: (params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/subscriptions/portal`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sellers
     * @name SellersControllerListSellers
     * @request GET:/v1/sellers
     */
    sellersControllerListSellers: (
      query: {
        status: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/sellers`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sellers
     * @name SellersControllerCreateSeller
     * @request POST:/v1/sellers
     */
    sellersControllerCreateSeller: (
      data: CreateSellerDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/sellers`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sellers
     * @name SellersControllerUpdateSeller
     * @request PATCH:/v1/sellers/{id}
     */
    sellersControllerUpdateSeller: (
      id: string,
      data: UpdateSellerDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/sellers/${id}`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sellers
     * @name SellersControllerListPayouts
     * @request GET:/v1/sellers/payouts
     */
    sellersControllerListPayouts: (
      query: {
        sellerId: string;
        status: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/sellers/payouts`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sellers
     * @name SellersControllerMarkPayoutPaid
     * @request POST:/v1/sellers/payouts/{id}/mark-paid
     */
    sellersControllerMarkPayoutPaid: (id: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/sellers/payouts/${id}/mark-paid`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sellers
     * @name SellersControllerListDisputes
     * @request GET:/v1/sellers/disputes
     */
    sellersControllerListDisputes: (
      query: {
        status: string;
      },
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/sellers/disputes`,
        method: "GET",
        query: query,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sellers
     * @name SellersControllerOpenDispute
     * @summary Open marketplace dispute
     * @request POST:/v1/sellers/disputes
     */
    sellersControllerOpenDispute: (
      data: CreateMarketplaceDisputeDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/sellers/disputes`,
        method: "POST",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Sellers
     * @name SellersControllerResolveDispute
     * @request PATCH:/v1/sellers/disputes/{id}/resolve
     */
    sellersControllerResolveDispute: (
      id: string,
      data: ResolveMarketplaceDisputeDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/sellers/disputes/${id}/resolve`,
        method: "PATCH",
        body: data,
        type: ContentType.Json,
        ...params,
      }),

    /**
     * No description
     *
     * @tags Dropship
     * @name DropshipControllerSplit
     * @summary Split dropship order items into supplier shipments
     * @request POST:/v1/dropship/orders/{orderId}/split
     */
    dropshipControllerSplit: (orderId: string, params: RequestParams = {}) =>
      this.request<void, any>({
        path: `/v1/dropship/orders/${orderId}/split`,
        method: "POST",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Bulk Import
     * @name BulkImportControllerImportProducts
     * @summary Import products from CSV (row-level error reporting)
     * @request POST:/v1/bulk-import/products
     * @secure
     */
    bulkImportControllerImportProducts: (
      data: ImportProductsCsvDto,
      params: RequestParams = {},
    ) =>
      this.request<void, any>({
        path: `/v1/bulk-import/products`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.Json,
        ...params,
      }),
  };
}
