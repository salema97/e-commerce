import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, PaymentProvider, PaymentStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTestPaymentDto } from './dto/create-test-payment.dto.js';

@Injectable()
export class TestPaymentsService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTestPaymentDto) {
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
