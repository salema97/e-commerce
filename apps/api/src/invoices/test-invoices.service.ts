import { ForbiddenException, Injectable } from '@nestjs/common';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { CreateTestInvoiceDto } from './dto/create-test-invoice.dto.js';

@Injectable()
export class TestInvoicesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateTestInvoiceDto) {
    const order = await this.prisma.order.findUnique({ where: { id: dto.orderId } });
    if (!order) {
      throw new ForbiddenException('Order not found');
    }

    const existing = await this.prisma.invoice.findUnique({ where: { orderId: dto.orderId } });
    if (existing) {
      return existing;
    }

    return this.prisma.invoice.create({
      data: {
        orderId: dto.orderId,
        documentType: dto.documentType ?? '01',
        accessKey: dto.accessKey ?? `TEST-${Date.now()}`,
        status: dto.status ?? InvoiceStatus.DRAFT,
        authorizationNumber: dto.authorizationNumber ?? null,
        sriResponse: Prisma.JsonNull,
      },
    });
  }
}
