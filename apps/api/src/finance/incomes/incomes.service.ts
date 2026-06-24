import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma, Income, IncomeSource } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateIncomeDto } from './dto/create-income.dto.js';
import { UpdateIncomeDto } from './dto/update-income.dto.js';
import { IncomeResponseDto } from './dto/income-response.dto.js';

export interface ListIncomesFilter {
  source?: IncomeSource;
  from?: Date;
  to?: Date;
  relatedOrderId?: string;
  limit?: number;
  offset?: number;
}

@Injectable()
export class IncomesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateIncomeDto): Promise<IncomeResponseDto> {
    if (dto.relatedOrderId) {
      await this.assertOrderExists(dto.relatedOrderId);
    }

    const income = await this.prisma.income.create({
      data: {
        source: dto.source,
        amount: new Prisma.Decimal(dto.amount),
        date: dto.date ?? new Date(),
        relatedOrderId: dto.relatedOrderId ?? null,
        notes: dto.notes ?? null,
      },
    });

    return this.mapToResponse(income);
  }

  async findAll(filter: ListIncomesFilter = {}): Promise<IncomeResponseDto[]> {
    const where: Prisma.IncomeWhereInput = {};

    if (filter.source) where.source = filter.source;
    if (filter.relatedOrderId) where.relatedOrderId = filter.relatedOrderId;
    if (filter.from || filter.to) {
      where.date = {};
      if (filter.from) where.date.gte = filter.from;
      if (filter.to) where.date.lte = filter.to;
    }

    const incomes = await this.prisma.income.findMany({
      where,
      orderBy: { date: 'desc' },
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });

    return incomes.map((income) => this.mapToResponse(income));
  }

  async findOne(id: string): Promise<IncomeResponseDto> {
    const income = await this.prisma.income.findUnique({ where: { id } });
    if (!income) {
      throw new NotFoundException(`Income ${id} not found`);
    }
    return this.mapToResponse(income);
  }

  async update(id: string, dto: UpdateIncomeDto): Promise<IncomeResponseDto> {
    await this.findOne(id);

    if (dto.relatedOrderId) {
      await this.assertOrderExists(dto.relatedOrderId);
    }

    const income = await this.prisma.income.update({
      where: { id },
      data: {
        ...(dto.source !== undefined ? { source: dto.source } : {}),
        ...(dto.amount !== undefined
          ? { amount: new Prisma.Decimal(dto.amount) }
          : {}),
        ...(dto.date !== undefined ? { date: dto.date } : {}),
        ...(dto.relatedOrderId !== undefined
          ? { relatedOrderId: dto.relatedOrderId }
          : {}),
        ...(dto.notes !== undefined ? { notes: dto.notes } : {}),
      },
    });

    return this.mapToResponse(income);
  }

  async remove(id: string): Promise<IncomeResponseDto> {
    await this.findOne(id);
    const income = await this.prisma.income.delete({ where: { id } });
    return this.mapToResponse(income);
  }

  private async assertOrderExists(orderId: string): Promise<void> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      select: { id: true },
    });
    if (!order) {
      throw new NotFoundException(`Order ${orderId} not found`);
    }
  }

  private mapToResponse(income: Income): IncomeResponseDto {
    return {
      id: income.id,
      source: income.source,
      amount: Number(income.amount),
      date: income.date,
      relatedOrderId: income.relatedOrderId,
      notes: income.notes,
      createdAt: income.createdAt,
      updatedAt: income.updatedAt,
    };
  }
}
