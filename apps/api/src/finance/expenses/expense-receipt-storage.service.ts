import { Injectable, NotFoundException } from '@nestjs/common';
import { StorageService } from '../../storage/storage.service.js';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class ExpenseReceiptStorageService {
  constructor(
    private readonly storage: StorageService,
    private readonly prisma: PrismaService,
  ) {}

  receiptKey(expenseId: string, fileName: string): string {
    const safeName = fileName.replace(/[^a-zA-Z0-9._-]/g, '_');
    return `finance/expenses/${expenseId}/${Date.now()}-${safeName}`;
  }

  async appendReceipt(
    expenseId: string,
    fileName: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<string> {
    const key = this.receiptKey(expenseId, fileName);
    const uploaded = await this.storage.uploadBuffer(key, buffer, contentType);

    const expense = await this.prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    const keys = this.parseKeys(expense.attachments);
    keys.push(uploaded.key);

    await this.prisma.expense.update({
      where: { id: expenseId },
      data: { attachments: keys },
    });

    return uploaded.key;
  }

  async getSignedUrl(expenseId: string, key: string): Promise<string> {
    const expense = await this.prisma.expense.findUnique({ where: { id: expenseId } });
    if (!expense) {
      throw new NotFoundException(`Expense ${expenseId} not found`);
    }

    const keys = this.parseKeys(expense.attachments);
    if (!keys.includes(key)) {
      throw new NotFoundException(`Receipt ${key} not found for expense ${expenseId}`);
    }

    return this.storage.getSignedUrl(key);
  }

  parseKeys(attachments: unknown): string[] {
    if (!attachments) return [];
    if (Array.isArray(attachments)) {
      return attachments.filter((item): item is string => typeof item === 'string');
    }
    return [];
  }
}
