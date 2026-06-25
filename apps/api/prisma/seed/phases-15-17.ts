import { createHash } from 'node:crypto';
import type { PrismaClient } from '@prisma/client';
import { IDS } from './constants.js';

export interface Phase15To17SeedContext {
  customerId: string;
  customer2Id: string;
  adminId: string;
  productLaptopId: string;
  productPhoneId: string;
  variantLaptopBaseId: string;
  orderDeliveredId: string;
  orderShippedId: string;
  subscriptionPlanId: string;
  storeLocationId: string;
  posRegisterId: string;
  conversationId: string;
  invoiceId: string;
  faqReturnsId: string;
}

function hashToken(value: string): string {
  return createHash('sha256').update(value).digest('hex');
}

export async function seedPhases15To17(
  prisma: PrismaClient,
  ctx: Phase15To17SeedContext,
): Promise<void> {
  await prisma.authSession.upsert({
    where: { tokenHash: hashToken('seed-session-customer') },
    update: { expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000) },
    create: {
      id: IDS.authSessionCustomer,
      userId: ctx.customerId,
      tokenHash: hashToken('seed-session-customer'),
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60_000),
      userAgent: 'SeedBrowser/1.0',
      ipAddress: '127.0.0.1',
    },
  });

  await prisma.pushDeviceToken.upsert({
    where: { token: 'ExponentPushToken[seed-customer-mobile]' },
    update: {},
    create: {
      id: IDS.pushTokenCustomer,
      userId: ctx.customerId,
      token: 'ExponentPushToken[seed-customer-mobile]',
      platform: 'expo',
    },
  });

  await prisma.knowledgeChunk.upsert({
    where: { id: IDS.knowledgeChunkFaq },
    update: {},
    create: {
      id: IDS.knowledgeChunkFaq,
      sourceType: 'FAQ',
      sourceId: ctx.faqReturnsId,
      content:
        'Aceptamos devoluciones dentro de los 30 días posteriores a la entrega si el producto está en buen estado.',
    },
  });

  await prisma.productContentDraft.upsert({
    where: { productId: ctx.productLaptopId },
    update: {},
    create: {
      id: IDS.productContentDraftLaptop,
      productId: ctx.productLaptopId,
      description: 'Ultrabook premium con pantalla 14" y batería de larga duración.',
      metaTitle: 'Laptop Pro 14 | NEO.STORE',
      metaDescription: 'Compra la Laptop Pro 14 con envío a todo Ecuador.',
      imageAlts: { '0': 'Laptop Pro 14 vista frontal' },
    },
  });

  await prisma.botInteraction.upsert({
    where: { id: IDS.botInteractionSeed },
    update: {},
    create: {
      id: IDS.botInteractionSeed,
      conversationId: ctx.conversationId,
      confidence: 0.92,
      escalated: false,
      chunkIds: [IDS.knowledgeChunkFaq],
      promptHash: 'seed-prompt-hash',
    },
  });

  const company = await prisma.company.upsert({
    where: { taxId: '1792146739002' },
    update: { isActive: true },
    create: {
      id: IDS.companyMain,
      name: 'Corporación Andina S.A.',
      taxId: '1792146739002',
      creditLimit: 25000,
      creditUsed: 1200,
      netPaymentTerms: 'NET_30',
      isActive: true,
    },
  });

  await prisma.companyUser.upsert({
    where: { companyId_userId: { companyId: company.id, userId: ctx.customerId } },
    update: { role: 'BUYER' },
    create: {
      id: IDS.companyUserCustomer,
      companyId: company.id,
      userId: ctx.customerId,
      role: 'BUYER',
    },
  });

  await prisma.companyPriceList.upsert({
    where: {
      companyId_productId_variantId: {
        companyId: company.id,
        productId: ctx.productLaptopId,
        variantId: ctx.variantLaptopBaseId,
      },
    },
    update: { unitPrice: 849.99 },
    create: {
      id: IDS.companyPriceLaptop,
      companyId: company.id,
      productId: ctx.productLaptopId,
      variantId: ctx.variantLaptopBaseId,
      unitPrice: 849.99,
      minQuantity: 5,
    },
  });

  await prisma.quote.upsert({
    where: { quoteNumber: 'COT-SEED-001' },
    update: {},
    create: {
      id: IDS.quoteDraft,
      quoteNumber: 'COT-SEED-001',
      companyId: company.id,
      requestedByUserId: ctx.customerId,
      status: 'PENDING_APPROVAL',
      expiresAt: new Date(Date.now() + 14 * 24 * 60 * 60_000),
      purchaseOrderNumber: 'PO-ANDINA-2026-01',
      subtotal: 4249.95,
      taxAmount: 637.49,
      total: 4887.44,
      notes: 'Cotización B2B para equipos de oficina.',
    },
  });

  await prisma.quoteLine.upsert({
    where: { id: IDS.quoteLineDraft },
    update: {},
    create: {
      id: IDS.quoteLineDraft,
      quoteId: IDS.quoteDraft,
      productId: ctx.productLaptopId,
      variantId: ctx.variantLaptopBaseId,
      name: 'Laptop Pro 14',
      sku: 'LAP-PRO-14-BASE',
      quantity: 5,
      unitPrice: 849.99,
    },
  });

  await prisma.marketplaceListing.upsert({
    where: {
      productId_channel: { productId: ctx.productLaptopId, channel: 'MERCADO_LIBRE' },
    },
    update: { status: 'PUBLISHED' },
    create: {
      id: IDS.marketplaceListingLaptop,
      productId: ctx.productLaptopId,
      channel: 'MERCADO_LIBRE',
      externalId: 'MLA-SEED-LAPTOP-001',
      status: 'PUBLISHED',
      lastSyncedAt: new Date(),
    },
  });

  await prisma.marketplaceOrderImport.upsert({
    where: {
      channel_externalOrderId: {
        channel: 'MERCADO_LIBRE',
        externalOrderId: 'ML-ORD-SEED-9001',
      },
    },
    update: {},
    create: {
      id: IDS.marketplaceOrderImport,
      channel: 'MERCADO_LIBRE',
      externalOrderId: 'ML-ORD-SEED-9001',
      status: 'PENDING',
      fees: 12.5,
      payload: {
        buyer: 'marketplace-buyer@example.com',
        items: [{ sku: 'LAP-PRO-14-BASE', qty: 1 }],
      },
    },
  });

  await prisma.accountingSyncRecord.upsert({
    where: {
      provider_resourceType_resourceId: {
        provider: 'SIIGO',
        resourceType: 'invoice',
        resourceId: ctx.invoiceId,
      },
    },
    update: {},
    create: {
      id: IDS.accountingSyncInvoice,
      provider: 'SIIGO',
      resourceType: 'invoice',
      resourceId: ctx.invoiceId,
      externalId: 'SIIGO-INV-SEED-002',
      status: 'SYNCED',
      syncedAt: new Date('2026-06-02'),
    },
  });

  await prisma.customerSubscription.upsert({
    where: { stripeSubscriptionId: 'sub_seed_shirt_monthly' },
    update: { status: 'ACTIVE' },
    create: {
      id: IDS.customerSubscriptionShirt,
      userId: ctx.customerId,
      planId: ctx.subscriptionPlanId,
      stripeSubscriptionId: 'sub_seed_shirt_monthly',
      status: 'ACTIVE',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60_000),
    },
  });

  const seller = await prisma.seller.upsert({
    where: { userId: ctx.customer2Id },
    update: { status: 'ACTIVE' },
    create: {
      id: IDS.sellerMain,
      userId: ctx.customer2Id,
      businessName: 'María Vega Accesorios',
      slug: 'maria-vega-accesorios',
      commissionRate: 12.5,
      status: 'ACTIVE',
    },
  });

  await prisma.product.update({
    where: { id: ctx.productPhoneId },
    data: { sellerId: seller.id },
  });

  await prisma.sellerPayout.upsert({
    where: { id: IDS.sellerPayoutPending },
    update: {},
    create: {
      id: IDS.sellerPayoutPending,
      sellerId: seller.id,
      orderId: ctx.orderDeliveredId,
      grossAmount: 1034.99,
      commissionAmount: 129.37,
      netAmount: 905.62,
      status: 'PENDING',
    },
  });

  await prisma.marketplaceDispute.upsert({
    where: { id: IDS.marketplaceDisputeOpen },
    update: {},
    create: {
      id: IDS.marketplaceDisputeOpen,
      orderId: ctx.orderShippedId,
      sellerId: seller.id,
      openedByUserId: ctx.customerId,
      reason: 'Producto no coincide con la descripción del marketplace.',
      status: 'OPEN',
    },
  });

  await prisma.order.upsert({
    where: { orderNumber: 'ORD-SEED-POS-001' },
    update: {},
    create: {
      id: IDS.orderPos,
      orderNumber: 'ORD-SEED-POS-001',
      userId: ctx.customerId,
      customerEmail: 'cliente@example.com',
      customerPhone: '+593999888777',
      customerName: 'Cliente Demo',
      status: 'DELIVERED',
      channel: 'POS',
      shippingMethod: 'PICKUP',
      pickupLocationId: ctx.storeLocationId,
      posRegisterId: ctx.posRegisterId,
      subtotal: 499.99,
      taxAmount: 75,
      shippingAmount: 0,
      discountAmount: 0,
      total: 574.99,
      paymentProvider: 'CASH',
      companyId: company.id,
      items: {
        create: {
          id: IDS.orderItemPos,
          productId: ctx.productPhoneId,
          variantId: IDS.variantPhone128,
          name: 'Smartphone X',
          sku: 'PHN-X-128-BLK',
          price: 499.99,
          quantity: 1,
          taxRate: 15,
          taxAmount: 75,
          fulfillmentSource: 'SELLER',
          sellerId: seller.id,
        },
      },
      statusHistory: {
        create: [
          { status: 'PENDING', notes: 'Venta POS' },
          { status: 'DELIVERED', notes: 'Entrega en tienda' },
        ],
      },
    },
  });

  await prisma.payment.upsert({
    where: { id: IDS.paymentPos },
    update: {},
    create: {
      id: IDS.paymentPos,
      orderId: IDS.orderPos,
      provider: 'CASH',
      providerTransactionId: 'cash_seed_pos_001',
      amount: 574.99,
      currency: 'USD',
      status: 'COMPLETED',
      idempotencyKey: 'seed-payment-pos',
    },
  });

  await prisma.conversation.upsert({
    where: { webSessionId: 'seed-web-chat-session' },
    update: {},
    create: {
      id: IDS.conversationWeb,
      userId: ctx.customerId,
      remoteJid: 'web:seed-session',
      channel: 'WEB',
      webSessionId: 'seed-web-chat-session',
      contactName: 'Cliente Demo',
      status: 'OPEN',
      botEnabled: true,
      lastMessageAt: new Date(),
      unreadCount: 0,
    },
  });
}
