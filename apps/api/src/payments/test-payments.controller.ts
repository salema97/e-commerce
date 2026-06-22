import { Controller, Post, Body, ForbiddenException } from '@nestjs/common';
import { Prisma, PaymentProvider, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { isTestAuthEnabled } from '../auth/test-auth.js';

class CreateTestPaymentDto {
  orderId!: string;
  amount?: number;
  provider?: PaymentProvider;
}

@Controller('test/payments')
export class TestPaymentsController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Body() dto: CreateTestPaymentDto) {
    if (!isTestAuthEnabled()) {
      throw new ForbiddenException('Test endpoints are disabled');
    }

    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) {
      throw new ForbiddenException('Order not found');
    }

    return this.prisma.payment.create({
      data: {
        orderId: dto.orderId,
        provider: dto.provider ?? PaymentProvider.STRIPE,
        amount: new Prisma.Decimal(dto.amount ?? order.total),
        status: PaymentStatus.COMPLETED,
        providerTransactionId: `pi_test_${Date.now()}`,
      },
    });
  }
}
