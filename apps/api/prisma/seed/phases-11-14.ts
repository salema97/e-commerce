import type { PrismaClient } from '@prisma/client';
import { IDS, SEED_REFERRAL_CODE } from './constants.js';

export interface PhaseSeedContext {
  customerId: string;
  adminId: string;
  productLaptopId: string;
  productPhoneId: string;
  productShirtId: string;
  orderDeliveredId: string;
  orderItemDeliveredId: string;
  categoryElectronicsId: string;
  supplierMainId: string;
}

function daysAgo(days: number): Date {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date;
}

function monthsAhead(months: number): Date {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date;
}

export async function seedPhases11To14(
  prisma: PrismaClient,
  ctx: PhaseSeedContext,
): Promise<void> {
  const passwordHash = await import('./auth.js').then((m) => m.hashSeedPassword());

  const customer2 = await prisma.user.upsert({
    where: { email: 'amiga@example.com' },
    update: { passwordHash, role: 'CUSTOMER' },
    create: {
      id: IDS.userCustomer2,
      email: 'amiga@example.com',
      passwordHash,
      name: 'María Vega',
      role: 'CUSTOMER',
      phone: '+593988776655',
    },
  });

  await prisma.shippingZone.upsert({
    where: { code: 'EC-PICH' },
    update: {},
    create: {
      id: IDS.shippingZoneQuito,
      name: 'Pichincha / Quito',
      code: 'EC-PICH',
      zoneType: 'DOMESTIC',
      provinces: ['Pichincha'],
      baseRate: 5,
      isActive: true,
    },
  });

  await prisma.shippingZone.upsert({
    where: { code: 'EC-GUAY' },
    update: {},
    create: {
      id: IDS.shippingZoneGuayas,
      name: 'Guayas / Guayaquil',
      code: 'EC-GUAY',
      zoneType: 'DOMESTIC',
      provinces: ['Guayas'],
      baseRate: 6.5,
      isActive: true,
    },
  });

  await prisma.shipment.upsert({
    where: { id: IDS.shipmentDelivered },
    update: {},
    create: {
      id: IDS.shipmentDelivered,
      orderId: ctx.orderDeliveredId,
      carrier: 'Servientrega',
      trackingNumber: 'EC-SEED-000002',
      trackingUrl: 'https://www.servientrega.com.ec/rastreo/EC-SEED-000002',
      status: 'DELIVERED',
      shippingCost: 0,
      shippedAt: daysAgo(5),
      deliveredAt: daysAgo(2),
      items: {
        create: {
          id: IDS.shipmentItemDelivered,
          orderItemId: ctx.orderItemDeliveredId,
          quantity: 1,
        },
      },
    },
  });

  await prisma.orderItem.update({
    where: { id: ctx.orderItemDeliveredId },
    data: {
      fulfillmentStatus: 'SHIPPED',
      quantityShipped: 1,
    },
  });

  const orderShipped = await prisma.order.upsert({
    where: { orderNumber: 'ORD-SEED-003' },
    update: {},
    create: {
      id: IDS.orderShipped,
      orderNumber: 'ORD-SEED-003',
      userId: ctx.customerId,
      customerEmail: 'cliente@example.com',
      customerPhone: '+593999888777',
      customerName: 'Cliente Demo',
      status: 'SHIPPED',
      channel: 'WEB',
      subtotal: 24.99,
      taxAmount: 3.75,
      shippingAmount: 5,
      discountAmount: 0,
      total: 33.74,
      paymentProvider: 'STRIPE',
      createdAt: daysAgo(3),
      items: {
        create: {
          id: IDS.orderItemShipped,
          productId: ctx.productShirtId,
          variantId: IDS.variantShirtM,
          name: 'Camiseta Algodón',
          sku: 'CAM-ALG-M-BLK',
          price: 24.99,
          quantity: 1,
          taxRate: 15,
          taxAmount: 3.75,
          fulfillmentStatus: 'PARTIALLY_SHIPPED',
          quantityShipped: 0,
        },
      },
      statusHistory: {
        create: [
          { status: 'PENDING', notes: 'Orden creada' },
          { status: 'PROCESSING', notes: 'Pago confirmado' },
          { status: 'SHIPPED', notes: 'En tránsito' },
        ],
      },
    },
  });

  await prisma.payment.upsert({
    where: { id: IDS.paymentShipped },
    update: {},
    create: {
      id: IDS.paymentShipped,
      orderId: orderShipped.id,
      provider: 'STRIPE',
      providerTransactionId: 'pi_seed_shipped',
      amount: 33.74,
      currency: 'USD',
      status: 'COMPLETED',
      idempotencyKey: 'seed-payment-shipped',
    },
  });

  await prisma.shipment.upsert({
    where: { id: IDS.shipmentInTransit },
    update: {},
    create: {
      id: IDS.shipmentInTransit,
      orderId: orderShipped.id,
      carrier: 'Laar',
      trackingNumber: 'EC-SEED-000003',
      trackingUrl: 'https://laarcourier.com/rastreo/EC-SEED-000003',
      status: 'IN_TRANSIT',
      shippingCost: 5,
      shippedAt: daysAgo(1),
      items: {
        create: {
          id: IDS.shipmentItemInTransit,
          orderItemId: IDS.orderItemShipped,
          quantity: 1,
        },
      },
    },
  });

  const analyticsEvents = [
    { event: 'product_view', days: 1, count: 120, sessionId: 'seed-session-views' },
    { event: 'product_view', days: 3, count: 85, sessionId: 'seed-session-views-2' },
    { event: 'add_to_cart', days: 2, count: 42, sessionId: 'seed-session-cart' },
    { event: 'begin_checkout', days: 2, count: 28, sessionId: 'seed-session-checkout' },
    { event: 'purchase', days: 1, count: 6, sessionId: 'seed-session-purchase', userId: ctx.customerId },
    { event: 'purchase', days: 5, count: 4, userId: ctx.customerId },
  ] as const;

  for (const row of analyticsEvents) {
    for (let i = 0; i < row.count; i++) {
      await prisma.analyticsEventRecord.create({
        data: {
          event: row.event,
          source: 'web',
          userId: 'userId' in row ? row.userId : i % 3 === 0 ? ctx.customerId : undefined,
          sessionId: 'sessionId' in row ? `${row.sessionId}-${i}` : `seed-anon-${row.event}-${i}`,
          properties: {
            productSlug: i % 2 === 0 ? 'laptop-pro-14' : 'smartphone-x',
            seed: true,
          },
          createdAt: daysAgo(row.days),
        },
      });
    }
  }

  const productWatch = await prisma.product.upsert({
    where: { slug: 'smartwatch-neo' },
    update: {
      isPreOrder: true,
      preOrderReleaseDate: monthsAhead(2),
      preOrderChargeTiming: 'AT_SHIPPING',
      status: 'ACTIVE',
    },
    create: {
      id: IDS.productWatch,
      name: 'Smartwatch Neo',
      slug: 'smartwatch-neo',
      description: 'Reloj inteligente con GPS — preventa con envío en lanzamiento.',
      sku: 'SW-NEO-01',
      status: 'ACTIVE',
      price: 199.99,
      compareAtPrice: 249.99,
      cost: 120,
      isFeatured: true,
      isPreOrder: true,
      preOrderReleaseDate: monthsAhead(2),
      preOrderChargeTiming: 'AT_SHIPPING',
      categoryId: ctx.categoryElectronicsId,
      supplierId: ctx.supplierMainId,
      images: {
        create: {
          url: 'https://placehold.co/800x600/0d9488/f0fdfa/png',
          alt: 'Smartwatch Neo',
          sortOrder: 0,
        },
      },
      attributes: {
        create: [
          { name: 'Marca', value: 'NeoWear' },
          { name: 'Conectividad', value: 'Bluetooth 5.3' },
        ],
      },
      variants: {
        create: {
          id: IDS.variantWatch,
          sku: 'SW-NEO-01-BLK',
          name: 'Negro',
          price: 199.99,
        },
      },
    },
  });

  await prisma.inventory.upsert({
    where: {
      productId_variantId: { productId: productWatch.id, variantId: IDS.variantWatch },
    },
    update: { quantity: 0 },
    create: {
      productId: productWatch.id,
      variantId: IDS.variantWatch,
      quantity: 0,
      reservedQuantity: 0,
      lowStockThreshold: 10,
    },
  });

  const brandAttributes = [
    { productId: ctx.productLaptopId, marca: 'NeoTech' },
    { productId: ctx.productPhoneId, marca: 'NeoTech' },
    { productId: ctx.productShirtId, marca: 'NeoWear' },
  ] as const;

  for (const { productId, marca } of brandAttributes) {
    const existing = await prisma.productAttribute.findFirst({
      where: { productId, name: 'Marca' },
    });
    if (existing) {
      await prisma.productAttribute.update({
        where: { id: existing.id },
        data: { value: marca },
      });
    } else {
      await prisma.productAttribute.create({
        data: { productId, name: 'Marca', value: marca },
      });
    }
  }

  await prisma.productReview.upsert({
    where: { id: IDS.reviewApprovedLaptop },
    update: {},
    create: {
      id: IDS.reviewApprovedLaptop,
      productId: ctx.productLaptopId,
      userId: ctx.customerId,
      orderId: ctx.orderDeliveredId,
      rating: 5,
      title: 'Excelente para trabajo remoto',
      body: 'Ligera, rápida y la batería dura todo el día. La recomiendo.',
      status: 'APPROVED',
      isVerifiedPurchase: true,
      createdAt: daysAgo(4),
    },
  });

  await prisma.productReview.upsert({
    where: { id: IDS.reviewApprovedLaptop2 },
    update: {},
    create: {
      id: IDS.reviewApprovedLaptop2,
      productId: ctx.productLaptopId,
      userId: customer2.id,
      rating: 4,
      title: 'Muy buena relación calidad-precio',
      body: 'Cumple con lo prometido. El teclado es cómodo.',
      status: 'APPROVED',
      isVerifiedPurchase: false,
      createdAt: daysAgo(7),
    },
  });

  await prisma.productReview.upsert({
    where: { id: IDS.reviewPendingPhone },
    update: {},
    create: {
      id: IDS.reviewPendingPhone,
      productId: ctx.productPhoneId,
      userId: ctx.customerId,
      orderId: IDS.orderPending,
      rating: 5,
      title: 'Gran cámara',
      body: 'Las fotos de noche salen increíbles. Pendiente de moderación.',
      status: 'PENDING',
      isVerifiedPurchase: true,
      createdAt: daysAgo(1),
    },
  });

  await prisma.productReview.upsert({
    where: { id: IDS.reviewPendingShirt },
    update: {},
    create: {
      id: IDS.reviewPendingShirt,
      productId: ctx.productShirtId,
      userId: customer2.id,
      rating: 3,
      title: 'Tela suave pero talla pequeña',
      body: 'Pedir una talla más. Esperando aprobación del equipo.',
      status: 'PENDING',
      isVerifiedPurchase: false,
      createdAt: daysAgo(2),
    },
  });

  await prisma.product.update({
    where: { id: ctx.productLaptopId },
    data: {
      averageRating: 4.5,
      reviewCount: 2,
    },
  });

  await prisma.referralCode.upsert({
    where: { userId: ctx.adminId },
    update: { code: SEED_REFERRAL_CODE, isActive: true },
    create: {
      id: IDS.referralCodeAdmin,
      userId: ctx.adminId,
      code: SEED_REFERRAL_CODE,
      isActive: true,
    },
  });

  await prisma.referralConversion.upsert({
    where: { orderId: ctx.orderDeliveredId },
    update: {},
    create: {
      id: IDS.referralConversionPending,
      referralCodeId: IDS.referralCodeAdmin,
      referredUserId: ctx.customerId,
      orderId: ctx.orderDeliveredId,
      commissionAmount: 51.75,
      status: 'PENDING',
      createdAt: daysAgo(2),
    },
  });

  const loyaltyAccount = await prisma.loyaltyAccount.upsert({
    where: { userId: ctx.customerId },
    update: { points: 550, tier: 'SILVER' },
    create: {
      id: IDS.loyaltyAccountCustomer,
      userId: ctx.customerId,
      points: 550,
      tier: 'SILVER',
    },
  });

  await prisma.loyaltyTransaction.upsert({
    where: { id: IDS.loyaltyTxEarn },
    update: {},
    create: {
      id: IDS.loyaltyTxEarn,
      accountId: loyaltyAccount.id,
      type: 'EARN',
      points: 500,
      reason: 'Compra ORD-SEED-002',
      orderId: ctx.orderDeliveredId,
      createdAt: daysAgo(2),
    },
  });

  await prisma.loyaltyTransaction.upsert({
    where: { id: IDS.loyaltyTxBonus },
    update: {},
    create: {
      id: IDS.loyaltyTxBonus,
      accountId: loyaltyAccount.id,
      type: 'EARN',
      points: 50,
      reason: 'Bono bienvenida programa lealtad',
      createdAt: daysAgo(10),
    },
  });
}

export function logPhaseSeedExpectations(): void {
  // eslint-disable-next-line no-console
  console.log('--- Phase 11–14 UI expectations (after seed) ---');
  // eslint-disable-next-line no-console
  console.log('  Phase 11  /admin/analytics     → embudo con views/cart/checkout/purchase + ingresos');
  // eslint-disable-next-line no-console
  console.log('  Phase 12  /admin/orders/...    → envío entregado ORD-SEED-002 + en tránsito ORD-SEED-003');
  // eslint-disable-next-line no-console
  console.log('            /store/orders/.../tracking → tracking Servientrega / Laar');
  // eslint-disable-next-line no-console
  console.log('  Phase 13  /store               → filtros por Marca (NeoTech / NeoWear)');
  // eslint-disable-next-line no-console
  console.log('  Phase 14  /admin/reviews       → 2 reseñas pendientes');
  // eslint-disable-next-line no-console
  console.log('            /admin/referrals     → 1 conversión, comisión pendiente ~$51.75');
  // eslint-disable-next-line no-console
  console.log('            /store/laptop-pro-14 → 2 reseñas aprobadas (★4.5)');
  // eslint-disable-next-line no-console
  console.log('            /store/smartwatch-neo  → badge preventa');
  // eslint-disable-next-line no-console
  console.log('            /account/loyalty       → 550 pts, tier SILVER (cliente@example.com)');
  // eslint-disable-next-line no-console
  console.log('            /account/referrals     → código STOREADMIN (admin) / usar ?ref= en checkout');
  // eslint-disable-next-line no-console
  console.log('  Post-reset: pnpm --filter @repo/api search:reindex');
  // eslint-disable-next-line no-console
  console.log('-----------------------------------------------\n');
}
