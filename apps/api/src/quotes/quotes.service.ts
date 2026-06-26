import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { NetPaymentTerms, OrderChannel, OrderStatus, QuoteStatus } from '@prisma/client';
import { ECUADOR_IVA_RATE } from '@repo/shared-utils';
import { PrismaService } from '../prisma/prisma.service.js';
import { B2bPricingService } from '../b2b/b2b-pricing.service.js';
import { OrdersService } from '../orders/orders.service.js';
import { CreateQuoteDto, UpdateQuoteStatusDto } from './dto/quote.dto.js';

@Injectable()
export class QuotesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly pricing: B2bPricingService,
    @Inject(forwardRef(() => OrdersService)) private readonly ordersService: OrdersService,
  ) {}

  async create(userId: string, dto: CreateQuoteDto) {
    if (!dto.items?.length) {
      throw new BadRequestException('Quote must contain at least one line');
    }

    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : this.defaultExpiry();
    const lines = await Promise.all(
      dto.items.map(async (item) => {
        const product = await this.prisma.product.findUnique({
          where: { id: item.productId },
          include: { variants: true },
        });
        if (!product) {
          throw new NotFoundException(`Product ${item.productId} not found`);
        }
        const variant = item.variantId
          ? product.variants.find((entry) => entry.id === item.variantId)
          : undefined;
        const fallback = Number(variant?.price ?? product.price);
        const unitPrice =
          item.unitPrice ??
          (await this.pricing.resolveUnitPrice(
            dto.companyId,
            product.id,
            item.variantId,
            item.quantity,
            fallback,
          ));

        return {
          productId: product.id,
          variantId: item.variantId,
          name: variant ? `${product.name} - ${variant.name}` : product.name,
          sku: variant?.sku ?? product.sku ?? product.id,
          quantity: item.quantity,
          unitPrice,
        };
      }),
    );

    const subtotal = lines.reduce((sum, line) => sum + line.unitPrice * line.quantity, 0);
    const taxAmount = Number((subtotal * ECUADOR_IVA_RATE).toFixed(2));
    const total = Number((subtotal + taxAmount).toFixed(2));
    const quoteNumber = `QT-${Date.now().toString(36).toUpperCase()}`;

    return this.prisma.quote.create({
      data: {
        quoteNumber,
        companyId: dto.companyId,
        requestedByUserId: userId,
        status: QuoteStatus.PENDING_APPROVAL,
        expiresAt,
        purchaseOrderNumber: dto.purchaseOrderNumber,
        notes: dto.notes,
        subtotal,
        taxAmount,
        total,
        items: { create: lines },
      },
      include: { items: true, company: { select: { id: true, name: true } } },
    });
  }

  listForAdmin(status?: QuoteStatus) {
    return this.prisma.quote.findMany({
      where: status ? { status } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { items: true, company: { select: { id: true, name: true } } },
      take: 100,
    });
  }

  listMine(userId: string) {
    return this.prisma.quote.findMany({
      where: { requestedByUserId: userId },
      orderBy: { createdAt: 'desc' },
      include: { items: true, company: { select: { id: true, name: true } } },
    });
  }

  async findOne(id: string) {
    const quote = await this.prisma.quote.findUnique({
      where: { id },
      include: { items: true, company: true },
    });
    if (!quote) {
      throw new NotFoundException(`Quote ${id} not found`);
    }
    return quote;
  }

  async updateStatus(id: string, dto: UpdateQuoteStatusDto) {
    const quote = await this.findOne(id);
    if (quote.status === QuoteStatus.CONVERTED) {
      throw new BadRequestException('Converted quotes cannot change status');
    }
    return this.prisma.quote.update({
      where: { id },
      data: { status: dto.status },
      include: { items: true },
    });
  }

  async convertToOrder(quoteId: string, userId: string) {
    const quote = await this.findOne(quoteId);
    if (quote.status !== QuoteStatus.APPROVED) {
      throw new BadRequestException('Only approved quotes can be converted');
    }
    if (quote.expiresAt < new Date()) {
      await this.prisma.quote.update({ where: { id: quoteId }, data: { status: QuoteStatus.EXPIRED } });
      throw new BadRequestException('Quote has expired');
    }
    if (quote.convertedOrderId) {
      throw new BadRequestException('Quote already converted');
    }

    const company = quote.companyId
      ? await this.prisma.company.findUnique({ where: { id: quote.companyId } })
      : null;

    if (company) {
      await this.pricing.assertCreditAvailable(company.id, Number(quote.total));
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const order = await this.ordersService.createOrder(userId, {
      items: quote.items.map((line) => ({
        productId: line.productId,
        variantId: line.variantId ?? undefined,
        quantity: line.quantity,
        price: Number(line.unitPrice),
      })),
      channel: OrderChannel.B2B,
      companyId: quote.companyId ?? undefined,
      purchaseOrderNumber: quote.purchaseOrderNumber ?? undefined,
      netPaymentTerms: company?.netPaymentTerms,
      customerEmail: user?.email ?? 'b2b@example.com',
      notes: quote.notes ?? undefined,
    });

    if (company && company.netPaymentTerms !== NetPaymentTerms.NET_0) {
      await this.prisma.order.update({
        where: { id: order.id },
        data: { status: OrderStatus.PROCESSING },
      });
      await this.pricing.applyCreditUsage(company.id, Number(quote.total));
    }

    await this.prisma.quote.update({
      where: { id: quoteId },
      data: { status: QuoteStatus.CONVERTED, convertedOrderId: order.id },
    });

    return { quoteId, orderId: order.id, orderNumber: order.orderNumber };
  }

  private defaultExpiry(): Date {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return date;
  }
}
