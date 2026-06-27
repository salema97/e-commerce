import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditLogService } from '../../audit/audit-log.service.js';
import { AdminStoreCreditDto } from './dto/admin-store-credit.dto.js';
import { IssueStoreCreditDto, UpdateStoreCreditDto } from './dto/issue-store-credit.dto.js';

@Injectable()
export class FinanceStoreCreditsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAll(): Promise<AdminStoreCreditDto[]> {
    const credits = await this.prisma.storeCredit.findMany({
      include: {
        user: { select: { email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return credits.map((credit) => this.toDto(credit));
  }

  async issue(dto: IssueStoreCreditDto, actorId: string): Promise<AdminStoreCreditDto> {
    if (dto.amount <= 0) {
      throw new BadRequestException('Amount must be positive');
    }

    const user = await this.prisma.user.findUnique({ where: { id: dto.userId } });
    if (!user) {
      throw new NotFoundException(`User ${dto.userId} not found`);
    }

    const currency = dto.currency ?? 'USD';
    const expiresAt = dto.expiresAt ? new Date(dto.expiresAt) : null;

    const record = await this.prisma.$transaction(async (tx) => {
      const existing = await tx.storeCredit.findFirst({
        where: { userId: dto.userId, currency },
      });

      if (existing) {
        return tx.storeCredit.update({
          where: { id: existing.id },
          data: {
            balance: { increment: new Prisma.Decimal(dto.amount) },
            ...(expiresAt !== null && { expiresAt }),
          },
          include: { user: { select: { email: true } } },
        });
      }

      return tx.storeCredit.create({
        data: {
          userId: dto.userId,
          balance: new Prisma.Decimal(dto.amount),
          currency,
          expiresAt,
        },
        include: { user: { select: { email: true } } },
      });
    });

    await this.auditLog.log({
      actorId,
      action: 'CREATE',
      resource: 'StoreCredit',
      resourceId: record.id,
      after: { userId: dto.userId, amount: dto.amount, currency },
    });

    return this.toDto(record);
  }

  async update(
    id: string,
    dto: UpdateStoreCreditDto,
    actorId: string,
  ): Promise<AdminStoreCreditDto> {
    const existing = await this.prisma.storeCredit.findUnique({
      where: { id },
      include: { user: { select: { email: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Store credit ${id} not found`);
    }

    const updated = await this.prisma.storeCredit.update({
      where: { id },
      data: {
        ...(dto.balance !== undefined && { balance: new Prisma.Decimal(dto.balance) }),
        ...(dto.expiresAt !== undefined && {
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        }),
      },
      include: { user: { select: { email: true } } },
    });

    await this.auditLog.log({
      actorId,
      action: 'UPDATE',
      resource: 'StoreCredit',
      resourceId: id,
      before: { balance: Number(existing.balance), expiresAt: existing.expiresAt },
      after: { balance: Number(updated.balance), expiresAt: updated.expiresAt },
    });

    return this.toDto(updated);
  }

  private toDto(credit: {
    id: string;
    userId: string;
    balance: Prisma.Decimal;
    currency: string;
    expiresAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    user: { email: string };
  }): AdminStoreCreditDto {
    return {
      id: credit.id,
      userId: credit.userId,
      userEmail: credit.user.email,
      balance: Number(credit.balance),
      currency: credit.currency,
      expiresAt: credit.expiresAt,
      createdAt: credit.createdAt,
      updatedAt: credit.updatedAt,
    };
  }
}
