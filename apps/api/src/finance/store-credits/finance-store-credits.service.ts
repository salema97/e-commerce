import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service.js';
import { AdminStoreCreditDto } from './dto/admin-store-credit.dto.js';

@Injectable()
export class FinanceStoreCreditsService {
  constructor(private readonly prisma: PrismaService) {}

  async findAll(): Promise<AdminStoreCreditDto[]> {
    const credits = await this.prisma.storeCredit.findMany({
      include: {
        user: { select: { email: true } },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return credits.map((credit) => ({
      id: credit.id,
      userId: credit.userId,
      userEmail: credit.user.email,
      balance: Number(credit.balance),
      currency: credit.currency,
      expiresAt: credit.expiresAt,
      createdAt: credit.createdAt,
      updatedAt: credit.updatedAt,
    }));
  }
}
