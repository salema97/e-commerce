import type { PrismaClient } from '@prisma/client';
import { ACCESS_KEYS, IDS } from './constants.js';
import { hashSeedPassword, logSeedCredentials } from './auth.js';

const ESTABLISHMENT = process.env.SRI_ESTABLISHMENT_CODE ?? '001';
const EMISSION_POINT = process.env.SRI_EMISSION_POINT_CODE ?? '001';

export async function seedDatabase(prisma: PrismaClient): Promise<void> {
  const passwordHash = await hashSeedPassword();
  logSeedCredentials();
  const supplierMain = await prisma.supplier.upsert({
    where: { id: IDS.supplierMain },
    update: {},
    create: {
      id: IDS.supplierMain,
      name: 'Distribuidora Andina',
      rucOrId: '1792146739001',
      contactName: 'María López',
      email: 'compras@andina.ec',
      phone: '+593991234567',
      address: 'Av. Amazonas N34-123, Quito',
      paymentTerms: 'Net 30',
      isActive: true,
    },
  });

  const supplierAlt = await prisma.supplier.upsert({
    where: { id: IDS.supplierAlt },
    update: {},
    create: {
      id: IDS.supplierAlt,
      name: 'Importadora Pacífico',
      rucOrId: '0991234567001',
      contactName: 'Carlos Ruiz',
      email: 'ventas@pacifico.ec',
      phone: '+593987654321',
      isActive: true,
    },
  });

  const categoryElectronics = await prisma.category.upsert({
    where: { slug: 'electronica' },
    update: {},
    create: {
      id: IDS.categoryElectronics,
      name: 'Electrónica',
      slug: 'electronica',
      description: 'Laptops, teléfonos y accesorios.',
      isActive: true,
    },
  });

  const categoryClothing = await prisma.category.upsert({
    where: { slug: 'ropa' },
    update: {},
    create: {
      id: IDS.categoryClothing,
      name: 'Ropa',
      slug: 'ropa',
      description: 'Prendas para hombre y mujer.',
      isActive: true,
    },
  });

  await prisma.category.upsert({
    where: { slug: 'celulares' },
    update: {},
    create: {
      id: IDS.categoryPhones,
      name: 'Celulares',
      slug: 'celulares',
      description: 'Smartphones y wearables.',
      parentId: categoryElectronics.id,
      isActive: true,
    },
  });

  const users = await Promise.all([
    prisma.user.upsert({
      where: { email: 'superadmin@example.com' },
      update: { passwordHash, role: 'SUPER_ADMIN' },
      create: {
        id: IDS.userSuperAdmin,
        email: 'superadmin@example.com',
        passwordHash,
        name: 'Super Admin',
        role: 'SUPER_ADMIN',
        phone: '+593900000001',
        stripeCustomerId: 'cus_seed_super_admin',
      },
    }),
    prisma.user.upsert({
      where: { email: 'store-admin@example.com' },
      update: { passwordHash, role: 'ADMIN' },
      create: {
        id: IDS.userAdmin,
        email: 'store-admin@example.com',
        passwordHash,
        name: 'Admin Usuario',
        role: 'ADMIN',
        phone: '+593900000002',
        stripeCustomerId: 'cus_seed_admin',
      },
    }),
    prisma.user.upsert({
      where: { email: 'finance@example.com' },
      update: { passwordHash, role: 'FINANCE' },
      create: {
        id: IDS.userFinance,
        email: 'finance@example.com',
        passwordHash,
        name: 'Finanzas Usuario',
        role: 'FINANCE',
        phone: '+593900000003',
      },
    }),
    prisma.user.upsert({
      where: { email: 'inventory@example.com' },
      update: { passwordHash, role: 'INVENTORY' },
      create: {
        id: IDS.userInventory,
        email: 'inventory@example.com',
        passwordHash,
        name: 'Inventario Usuario',
        role: 'INVENTORY',
        phone: '+593900000004',
      },
    }),
    prisma.user.upsert({
      where: { email: 'support@example.com' },
      update: { passwordHash, role: 'SUPPORT' },
      create: {
        id: IDS.userSupport,
        email: 'support@example.com',
        passwordHash,
        name: 'Soporte Usuario',
        role: 'SUPPORT',
        phone: '+593900000005',
      },
    }),
    prisma.user.upsert({
      where: { email: 'cliente@example.com' },
      update: { passwordHash, role: 'CUSTOMER' },
      create: {
        id: IDS.userCustomer,
        email: 'cliente@example.com',
        passwordHash,
        name: 'Cliente Demo',
        role: 'CUSTOMER',
        identification: '1723456789',
        phone: '+593999888777',
        stripeCustomerId: 'cus_seed_customer',
      },
    }),
    prisma.user.upsert({
      where: { email: 'guest@example.com' },
      update: {},
      create: {
        id: IDS.userGuest,
        email: 'guest@example.com',
        name: 'Invitado Demo',
        role: 'GUEST',
      },
    }),
  ]);

  const [, , , , , customer] = users;

  const productLaptop = await prisma.product.upsert({
    where: { slug: 'laptop-pro-14' },
    update: { status: 'ACTIVE', isFeatured: true },
    create: {
      id: IDS.productLaptop,
      name: 'Laptop Pro 14',
      slug: 'laptop-pro-14',
      description: 'Ultrabook 14" para trabajo y estudio.',
      sku: 'LAP-PRO-14',
      status: 'ACTIVE',
      price: 899.99,
      compareAtPrice: 999.99,
      cost: 620,
      isFeatured: true,
      categoryId: categoryElectronics.id,
      supplierId: supplierMain.id,
      images: {
        create: {
          url: 'https://placehold.co/800x600/1e293b/f8fafc/png',
          alt: 'Laptop Pro 14',
          sortOrder: 0,
        },
      },
      attributes: {
        create: [
          { name: 'RAM', value: '16GB' },
          { name: 'Almacenamiento', value: '512GB SSD' },
        ],
      },
      variants: {
        create: {
          id: IDS.variantLaptopBase,
          sku: 'LAP-PRO-14-BASE',
          name: 'Base',
          price: 899.99,
        },
      },
    },
  });

  const productPhone = await prisma.product.upsert({
    where: { slug: 'smartphone-x' },
    update: { status: 'ACTIVE', isFeatured: true },
    create: {
      id: IDS.productPhone,
      name: 'Smartphone X',
      slug: 'smartphone-x',
      description: 'Teléfono 5G con cámara de 48MP.',
      sku: 'PHN-X-128',
      status: 'ACTIVE',
      price: 499.99,
      compareAtPrice: 549.99,
      cost: 340,
      isFeatured: true,
      categoryId: IDS.categoryPhones,
      supplierId: supplierAlt.id,
      images: {
        create: {
          url: 'https://placehold.co/800x600/0f172a/e2e8f0/png',
          alt: 'Smartphone X',
          sortOrder: 0,
        },
      },
      attributes: {
        create: [{ name: 'Color', value: 'Negro' }],
      },
      variants: {
        create: {
          id: IDS.variantPhone128,
          sku: 'PHN-X-128-BLK',
          name: '128GB Negro',
          price: 499.99,
        },
      },
    },
  });

  const productShirt = await prisma.product.upsert({
    where: { slug: 'camiseta-algodon' },
    update: { status: 'ACTIVE' },
    create: {
      id: IDS.productShirt,
      name: 'Camiseta Algodón',
      slug: 'camiseta-algodon',
      description: 'Camiseta unisex 100% algodón.',
      sku: 'CAM-ALG-M',
      status: 'ACTIVE',
      price: 24.99,
      cost: 9.5,
      categoryId: categoryClothing.id,
      supplierId: supplierMain.id,
      images: {
        create: {
          url: 'https://placehold.co/800x600/334155/f8fafc/png',
          alt: 'Camiseta algodón',
          sortOrder: 0,
        },
      },
      variants: {
        create: {
          id: IDS.variantShirtM,
          sku: 'CAM-ALG-M-BLK',
          name: 'M Negro',
          price: 24.99,
        },
      },
    },
  });

  await Promise.all([
    prisma.productImage.updateMany({
      where: { productId: productLaptop.id, sortOrder: 0 },
      data: { url: 'https://placehold.co/800x600/1e293b/f8fafc/png' },
    }),
    prisma.productImage.updateMany({
      where: { productId: productPhone.id, sortOrder: 0 },
      data: { url: 'https://placehold.co/800x600/0f172a/e2e8f0/png' },
    }),
    prisma.productImage.updateMany({
      where: { productId: productShirt.id, sortOrder: 0 },
      data: { url: 'https://placehold.co/800x600/334155/f8fafc/png' },
    }),
  ]);

  await Promise.all([
    prisma.inventory.upsert({
      where: { productId_variantId: { productId: productLaptop.id, variantId: IDS.variantLaptopBase } },
      update: { quantity: 25 },
      create: {
        productId: productLaptop.id,
        variantId: IDS.variantLaptopBase,
        quantity: 25,
        reservedQuantity: 0,
        lowStockThreshold: 5,
      },
    }),
    prisma.inventory.upsert({
      where: { productId_variantId: { productId: productPhone.id, variantId: IDS.variantPhone128 } },
      update: { quantity: 40 },
      create: {
        productId: productPhone.id,
        variantId: IDS.variantPhone128,
        quantity: 40,
        reservedQuantity: 0,
        lowStockThreshold: 8,
      },
    }),
    prisma.inventory.upsert({
      where: { productId_variantId: { productId: productShirt.id, variantId: IDS.variantShirtM } },
      update: { quantity: 0 },
      create: {
        productId: productShirt.id,
        variantId: IDS.variantShirtM,
        quantity: 0,
        reservedQuantity: 0,
        lowStockThreshold: 20,
      },
    }),
  ]);

  const promotion = await prisma.promotion.upsert({
    where: { id: IDS.promotionSummer },
    update: {},
    create: {
      id: IDS.promotionSummer,
      name: 'Verano 2026',
      type: 'PERCENTAGE',
      value: 10,
      startsAt: new Date('2026-01-01'),
      endsAt: new Date('2026-12-31'),
      isActive: true,
    },
  });

  await prisma.coupon.upsert({
    where: { code: 'VERANO10' },
    update: {},
    create: {
      id: IDS.couponSummer,
      code: 'VERANO10',
      promotionId: promotion.id,
      usageLimit: 500,
      usageCount: 12,
      isActive: true,
    },
  });

  await prisma.discountRule.upsert({
    where: { id: IDS.discountRuleSummer },
    update: {},
    create: {
      id: IDS.discountRuleSummer,
      promotionId: promotion.id,
      minimumAmount: 50,
      applicableCategoryId: categoryElectronics.id,
    },
  });

  await prisma.invoiceSequence.upsert({
    where: {
      documentType_establishmentCode_emissionPointCode: {
        documentType: '01',
        establishmentCode: ESTABLISHMENT,
        emissionPointCode: EMISSION_POINT,
      },
    },
    update: {},
    create: {
      documentType: '01',
      establishmentCode: ESTABLISHMENT,
      emissionPointCode: EMISSION_POINT,
      authorizedFrom: 1,
      authorizedTo: 999_999_999,
      lastNumber: 2,
    },
  });

  await prisma.invoiceSequence.upsert({
    where: {
      documentType_establishmentCode_emissionPointCode: {
        documentType: '04',
        establishmentCode: ESTABLISHMENT,
        emissionPointCode: EMISSION_POINT,
      },
    },
    update: {},
    create: {
      documentType: '04',
      establishmentCode: ESTABLISHMENT,
      emissionPointCode: EMISSION_POINT,
      authorizedFrom: 1,
      authorizedTo: 999_999_999,
      lastNumber: 1,
    },
  });

  const orderPending = await prisma.order.upsert({
    where: { orderNumber: 'ORD-SEED-001' },
    update: {},
    create: {
      id: IDS.orderPending,
      orderNumber: 'ORD-SEED-001',
      userId: customer.id,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerName: customer.name,
      status: 'PAYMENT_PENDING',
      channel: 'WEB',
      subtotal: 499.99,
      taxAmount: 75,
      shippingAmount: 5,
      discountAmount: 0,
      total: 579.99,
      couponCode: 'VERANO10',
      paymentProvider: 'STRIPE',
      reservationExpiresAt: new Date(Date.now() + 30 * 60_000),
      items: {
        create: {
          id: IDS.orderItemPending,
          productId: productPhone.id,
          variantId: IDS.variantPhone128,
          name: productPhone.name,
          sku: 'PHN-X-128-BLK',
          price: 499.99,
          quantity: 1,
          taxRate: 15,
          taxAmount: 75,
        },
      },
      statusHistory: {
        create: [
          { status: 'PENDING', notes: 'Orden creada' },
          { status: 'PAYMENT_PENDING', notes: 'Esperando pago' },
        ],
      },
    },
  });

  const orderDelivered = await prisma.order.upsert({
    where: { orderNumber: 'ORD-SEED-002' },
    update: {},
    create: {
      id: IDS.orderDelivered,
      orderNumber: 'ORD-SEED-002',
      userId: customer.id,
      customerEmail: customer.email,
      customerPhone: customer.phone,
      customerName: customer.name,
      status: 'DELIVERED',
      channel: 'WEB',
      subtotal: 899.99,
      taxAmount: 135,
      shippingAmount: 0,
      discountAmount: 0,
      total: 1034.99,
      paymentProvider: 'STRIPE',
      items: {
        create: {
          id: IDS.orderItemDelivered,
          productId: productLaptop.id,
          variantId: IDS.variantLaptopBase,
          name: productLaptop.name,
          sku: 'LAP-PRO-14-BASE',
          price: 899.99,
          quantity: 1,
          taxRate: 15,
          taxAmount: 135,
        },
      },
      statusHistory: {
        create: [
          { status: 'PENDING', notes: 'Orden creada' },
          { status: 'PROCESSING', notes: 'Pago confirmado' },
          { status: 'SHIPPED', notes: 'Enviada' },
          { status: 'DELIVERED', notes: 'Entregada' },
        ],
      },
    },
  });

  await prisma.payment.upsert({
    where: { id: IDS.paymentPending },
    update: {},
    create: {
      id: IDS.paymentPending,
      orderId: orderPending.id,
      provider: 'STRIPE',
      providerTransactionId: 'pi_seed_pending',
      amount: 579.99,
      currency: 'USD',
      status: 'PENDING',
      idempotencyKey: 'seed-payment-pending',
    },
  });

  await prisma.payment.upsert({
    where: { id: IDS.paymentCompleted },
    update: {},
    create: {
      id: IDS.paymentCompleted,
      orderId: orderDelivered.id,
      provider: 'STRIPE',
      providerTransactionId: 'pi_seed_completed',
      amount: 1034.99,
      currency: 'USD',
      status: 'COMPLETED',
      idempotencyKey: 'seed-payment-completed',
    },
  });

  await prisma.receipt.upsert({
    where: { orderId: orderDelivered.id },
    update: {},
    create: {
      id: IDS.receiptDelivered,
      orderId: orderDelivered.id,
      number: 'REC-SEED-002',
      url: 'https://example.com/receipts/ORD-SEED-002.pdf',
    },
  });

  await prisma.invoice.upsert({
    where: { orderId: orderDelivered.id },
    update: {},
    create: {
      id: IDS.invoiceDelivered,
      orderId: orderDelivered.id,
      documentType: '01',
      sequenceNumber: '001-001-000000002',
      accessKey: ACCESS_KEYS.invoice,
      authorizationNumber: 'AUTH-SEED-002',
      authorizationDate: new Date('2026-06-01'),
      status: 'AUTHORIZED',
      sriStatus: 'AUTHORIZED',
      deliveryStatus: 'DELIVERED',
      deliveredAt: new Date('2026-06-01'),
    },
  });

  await prisma.creditNote.upsert({
    where: { accessKey: ACCESS_KEYS.creditNote },
    update: {},
    create: {
      id: IDS.creditNoteSeed,
      accessKey: ACCESS_KEYS.creditNote,
      parentInvoiceAccessKey: ACCESS_KEYS.invoice,
      sequenceNumber: '001-001-000000001',
      authorizationNumber: 'AUTH-CN-001',
      authorizationDate: new Date('2026-06-10'),
      status: 'AUTHORIZED',
      sriStatus: 'AUTHORIZED',
      totalAmount: 1034.99,
      deliveryStatus: 'DELIVERED',
      deliveredAt: new Date('2026-06-10'),
    },
  });

  await prisma.returnRequest.upsert({
    where: { id: IDS.returnRequestSeed },
    update: {},
    create: {
      id: IDS.returnRequestSeed,
      orderId: orderDelivered.id,
      userId: customer.id,
      status: 'APPROVED',
      reason: 'Producto con defecto de fábrica',
      refundMethod: 'ORIGINAL_PAYMENT',
      creditNoteId: IDS.creditNoteSeed,
      approvedById: IDS.userAdmin,
      inspectedAt: new Date('2026-06-09'),
      items: {
        create: {
          id: IDS.returnItemSeed,
          productId: productLaptop.id,
          productVariantId: IDS.variantLaptopBase,
          quantity: 1,
          condition: 'DAMAGED',
          refundValue: 1034.99,
        },
      },
    },
  });

  await prisma.refund.upsert({
    where: { id: IDS.refundSeed },
    update: {},
    create: {
      id: IDS.refundSeed,
      orderId: orderDelivered.id,
      paymentId: IDS.paymentCompleted,
      returnRequestId: IDS.returnRequestSeed,
      providerRefundId: 're_seed_001',
      amount: 1034.99,
      reason: 'Devolución aprobada',
      status: 'COMPLETED',
      requestedById: customer.id,
      approvedById: IDS.userAdmin,
    },
  });

  await prisma.cart.upsert({
    where: { userId: customer.id },
    update: {},
    create: {
      id: IDS.cartCustomer,
      userId: customer.id,
      items: {
        create: {
          id: IDS.cartItemCustomer,
          productId: productShirt.id,
          variantId: IDS.variantShirtM,
          quantity: 2,
        },
      },
    },
  });

  await prisma.cart.upsert({
    where: { sessionId: 'seed-guest-session' },
    update: {},
    create: {
      id: IDS.cartGuest,
      sessionId: 'seed-guest-session',
      items: {
        create: {
          id: IDS.cartItemGuest,
          productId: productPhone.id,
          variantId: IDS.variantPhone128,
          quantity: 1,
        },
      },
    },
  });

  await prisma.address.upsert({
    where: { id: IDS.addressCustomer },
    update: {},
    create: {
      id: IDS.addressCustomer,
      userId: customer.id,
      label: 'Casa',
      recipientName: customer.name ?? 'Cliente Demo',
      street: 'Calle Los Álamos E4-56',
      city: 'Quito',
      state: 'Pichincha',
      country: 'Ecuador',
      zipCode: '170150',
      phone: customer.phone,
      isDefault: true,
    },
  });

  await prisma.wishlist.upsert({
    where: { userId_productId: { userId: customer.id, productId: productLaptop.id } },
    update: {},
    create: {
      id: IDS.wishlistSeed,
      userId: customer.id,
      productId: productLaptop.id,
    },
  });

  await prisma.backInStockAlert.upsert({
    where: { id: IDS.backInStockSeed },
    update: {},
    create: {
      id: IDS.backInStockSeed,
      productId: productShirt.id,
      email: 'alertas@example.com',
      isNotified: false,
    },
  });

  const conversation = await prisma.conversation.upsert({
    where: {
      remoteJid_instance: {
        remoteJid: '593999888777@s.whatsapp.net',
        instance: 'ecommerce',
      },
    },
    update: {},
    create: {
      id: IDS.conversationSeed,
      userId: customer.id,
      remoteJid: '593999888777@s.whatsapp.net',
      contactName: customer.name,
      status: 'OPEN',
      assignedAgentId: IDS.userSupport,
      lastMessageAt: new Date(),
      unreadCount: 1,
    },
  });

  await prisma.message.upsert({
    where: { externalMessageId: 'seed-msg-in-001' },
    update: {},
    create: {
      id: IDS.messageInbound,
      conversationId: conversation.id,
      remoteJid: conversation.remoteJid,
      direction: 'INBOUND',
      contentType: 'TEXT',
      content: 'Hola, ¿cuál es el estado de mi pedido ORD-SEED-002?',
      status: 'DELIVERED',
      externalMessageId: 'seed-msg-in-001',
      sentAt: new Date('2026-06-20T10:00:00Z'),
      deliveredAt: new Date('2026-06-20T10:00:01Z'),
    },
  });

  await prisma.message.upsert({
    where: { externalMessageId: 'seed-msg-out-001' },
    update: {},
    create: {
      id: IDS.messageOutbound,
      conversationId: conversation.id,
      remoteJid: conversation.remoteJid,
      direction: 'OUTBOUND',
      contentType: 'TEXT',
      content: 'Tu pedido ORD-SEED-002 fue entregado el 1 de junio.',
      status: 'READ',
      externalMessageId: 'seed-msg-out-001',
      sentAt: new Date('2026-06-20T10:05:00Z'),
      deliveredAt: new Date('2026-06-20T10:05:02Z'),
      readAt: new Date('2026-06-20T10:06:00Z'),
    },
  });

  const expenseCategoryOps = await prisma.expenseCategory.upsert({
    where: { name: 'Operaciones' },
    update: {},
    create: {
      id: IDS.expenseCategoryOps,
      name: 'Operaciones',
      description: 'Gastos operativos del negocio',
    },
  });

  await prisma.expenseCategory.upsert({
    where: { name: 'Marketing' },
    update: {},
    create: {
      id: IDS.expenseCategoryMarketing,
      name: 'Marketing',
      description: 'Publicidad y campañas',
    },
  });

  await prisma.expense.upsert({
    where: { id: IDS.expenseSeed },
    update: {},
    create: {
      id: IDS.expenseSeed,
      categoryId: expenseCategoryOps.id,
      supplierId: supplierMain.id,
      amount: 250,
      status: 'PAID',
      description: 'Mensualidad bodega',
      date: new Date('2026-06-01'),
    },
  });

  await prisma.income.upsert({
    where: { id: IDS.incomeSeed },
    update: {},
    create: {
      id: IDS.incomeSeed,
      source: 'ORDER',
      amount: 1034.99,
      relatedOrderId: orderDelivered.id,
      notes: 'Ingreso por ORD-SEED-002',
      date: new Date('2026-06-01'),
    },
  });

  await prisma.storeCredit.upsert({
    where: { id: IDS.storeCreditSeed },
    update: {},
    create: {
      id: IDS.storeCreditSeed,
      userId: customer.id,
      balance: 50,
      currency: 'USD',
      expiresAt: new Date('2027-01-01'),
    },
  });

  await prisma.sriDocumentJob.upsert({
    where: { jobId: 'seed-sri-job-001' },
    update: {},
    create: {
      id: IDS.sriJobSeed,
      documentType: '01',
      documentId: orderDelivered.id,
      jobId: 'seed-sri-job-001',
      status: 'COMPLETED',
      attempts: 1,
      maxAttempts: 5,
      payload: { orderId: orderDelivered.id },
    },
  });

  await prisma.auditLog.upsert({
    where: { id: IDS.auditLogSeed },
    update: {},
    create: {
      id: IDS.auditLogSeed,
      actorId: IDS.userAdmin,
      resource: 'product',
      action: 'update',
      resourceId: productLaptop.id,
      diff: { status: { from: 'DRAFT', to: 'ACTIVE' } },
      metadata: { source: 'seed' },
    },
  });

  await prisma.faq.upsert({
    where: { id: IDS.faqReturns },
    update: {},
    create: {
      id: IDS.faqReturns,
      question: '¿Cuál es la política de devoluciones?',
      answer:
        'Aceptamos devoluciones dentro de los 30 días posteriores a la entrega, siempre que el producto esté en su estado original.',
      isPublished: true,
      sortOrder: 1,
    },
  });

  await prisma.faq.upsert({
    where: { id: IDS.faqShipping },
    update: {},
    create: {
      id: IDS.faqShipping,
      question: '¿Cuánto tarda el envío?',
      answer:
        'Los envíos dentro de Ecuador suelen tardar entre 2 y 5 días hábiles según la ciudad.',
      isPublished: true,
      sortOrder: 2,
    },
  });

  await prisma.cmsPage.upsert({
    where: { slug: 'politica-devoluciones' },
    update: {},
    create: {
      title: 'Política de devoluciones',
      slug: 'politica-devoluciones',
      bodyMarkdown:
        'Puedes solicitar una devolución dentro de los 30 días. Contáctanos por WhatsApp o chat web.',
      isPublished: true,
    },
  });

  await prisma.cmsPage.upsert({
    where: { slug: 'politica-privacidad' },
    update: {},
    create: {
      title: 'Política de privacidad',
      slug: 'politica-privacidad',
      bodyMarkdown:
        'Respetamos tu privacidad. Solo usamos tus datos para procesar pedidos, soporte y comunicaciones relacionadas con tu compra.',
      isPublished: true,
    },
  });

  await prisma.cmsPage.upsert({
    where: { slug: 'terminos-servicio' },
    update: {},
    create: {
      title: 'Términos de servicio',
      slug: 'terminos-servicio',
      bodyMarkdown:
        'Al usar NEO.STORE aceptas nuestros términos de compra, envío y facturación electrónica conforme a la normativa ecuatoriana.',
      isPublished: true,
    },
  });

  await prisma.cmsPage.upsert({
    where: { slug: 'politica-envios' },
    update: {},
    create: {
      title: 'Política de envíos',
      slug: 'politica-envios',
      bodyMarkdown:
        'Enviamos a todo el Ecuador. Los tiempos estimados son de 2 a 5 días hábiles según la ciudad de destino.',
      isPublished: true,
    },
  });

  // eslint-disable-next-line no-console
  console.log('Seed completed for all models:', {
    suppliers: 2,
    categories: 3,
    products: 3,
    users: users.length,
    orders: 2,
    promotions: 1,
  });
}
