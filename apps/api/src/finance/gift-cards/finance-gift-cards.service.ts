import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { randomBytes } from 'crypto';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AuditLogService } from '../../audit/audit-log.service.js';
import { AdminGiftCardDto } from './dto/admin-gift-card.dto.js';
import { CreateGiftCardDto, UpdateGiftCardDto } from './dto/create-gift-card.dto.js';

@Injectable()
export class FinanceGiftCardsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly auditLog: AuditLogService,
  ) {}

  async findAll(): Promise<AdminGiftCardDto[]> {
    const cards = await this.prisma.giftCard.findMany({
      include: { issuedToUser: { select: { email: true } } },
      orderBy: { createdAt: 'desc' },
    });
    return cards.map((card) => this.toDto(card));
  }

  async create(dto: CreateGiftCardDto, actorId: string): Promise<AdminGiftCardDto> {
    if (dto.initialBalance <= 0) {
      throw new BadRequestException('initialBalance must be positive');
    }

    if (dto.issuedToUserId) {
      const user = await this.prisma.user.findUnique({ where: { id: dto.issuedToUserId } });
      if (!user) {
        throw new NotFoundException(`User ${dto.issuedToUserId} not found`);
      }
    }

    const code = (dto.code ?? this.generateCode()).toUpperCase();
    const existing = await this.prisma.giftCard.findUnique({ where: { code } });
    if (existing) {
      throw new BadRequestException(`Gift card code ${code} already exists`);
    }

    const card = await this.prisma.giftCard.create({
      data: {
        code,
        initialBalance: new Prisma.Decimal(dto.initialBalance),
        balance: new Prisma.Decimal(dto.initialBalance),
        currency: dto.currency ?? 'USD',
        expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        issuedToUserId: dto.issuedToUserId ?? null,
        note: dto.note ?? null,
      },
      include: { issuedToUser: { select: { email: true } } },
    });

    await this.auditLog.log({
      actorId,
      action: 'CREATE',
      resource: 'GiftCard',
      resourceId: card.id,
      after: { code, initialBalance: dto.initialBalance },
    });

    return this.toDto(card);
  }

  async update(id: string, dto: UpdateGiftCardDto, actorId: string): Promise<AdminGiftCardDto> {
    const existing = await this.prisma.giftCard.findUnique({
      where: { id },
      include: { issuedToUser: { select: { email: true } } },
    });
    if (!existing) {
      throw new NotFoundException(`Gift card ${id} not found`);
    }

    const updated = await this.prisma.giftCard.update({
      where: { id },
      data: {
        ...(dto.balance !== undefined && { balance: new Prisma.Decimal(dto.balance) }),
        ...(dto.expiresAt !== undefined && {
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
        }),
        ...(dto.isActive !== undefined && { isActive: dto.isActive }),
        ...(dto.note !== undefined && { note: dto.note }),
      },
      include: { issuedToUser: { select: { email: true } } },
    });

    await this.auditLog.log({
      actorId,
      action: 'UPDATE',
      resource: 'GiftCard',
      resourceId: id,
      before: {
        balance: Number(existing.balance),
        isActive: existing.isActive,
      },
      after: {
        balance: Number(updated.balance),
        isActive: updated.isActive,
      },
    });

    return this.toDto(updated);
  }

  private generateCode(): string {
    return `GC-${randomBytes(4).toString('hex').toUpperCase()}`;
  }

  private toDto(card: {
    id: string;
    code: string;
    initialBalance: Prisma.Decimal;
    balance: Prisma.Decimal;
    currency: string;
    expiresAt: Date | null;
    isActive: boolean;
    issuedToUserId: string | null;
    note: string | null;
    createdAt: Date;
    updatedAt: Date;
    issuedToUser: { email: string } | null;
  }): AdminGiftCardDto {
    return {
      id: card.id,
      code: card.code,
      initialBalance: Number(card.initialBalance),
      balance: Number(card.balance),
      currency: card.currency,
      expiresAt: card.expiresAt,
      isActive: card.isActive,
      issuedToUserId: card.issuedToUserId,
      issuedToUserEmail: card.issuedToUser?.email ?? null,
      note: card.note,
      createdAt: card.createdAt,
      updatedAt: card.updatedAt,
    };
  }
}
