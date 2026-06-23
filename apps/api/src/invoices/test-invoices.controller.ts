import { Controller, Post, Body, ForbiddenException } from '@nestjs/common';
import { Prisma, InvoiceStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { isTestAuthEnabled } from '../auth/test-auth.js';

class CreateTestInvoiceDto {
  orderId!: string;
  accessKey?: string;
  status?: InvoiceStatus;
  documentType?: string;
  authorizationNumber?: string | null;
}

@Controller('test/invoices')
export class TestInvoicesController {
  constructor(private readonly prisma: PrismaService) {}

  @Post()
  async create(@Body() dto: CreateTestInvoiceDto) {
    if (!isTestAuthEnabled()) {
      throw new ForbiddenException('Test endpoints are disabled');
    }

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
        xmlContent: null,
        sriResponse: Prisma.JsonNull,
      },
    });
  }
}
