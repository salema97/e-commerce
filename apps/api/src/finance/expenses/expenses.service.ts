import {
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Expense, ExpenseStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import {
  CreateExpenseDto,
  ExpenseResponseDto,
  UpdateExpenseDto,
} from './dto/expense.dto.js';
import { ExpenseReceiptStorageService } from './expense-receipt-storage.service.js';

export interface ListExpensesFilter {
  categoryId?: string;
  supplierId?: string;
  status?: ExpenseStatus;
  from?: Date;
  to?: Date;
  limit?: number;
  offset?: number;
}

@Injectable()
export class ExpensesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly receiptStorage: ExpenseReceiptStorageService,
  ) {}

  async create(dto: CreateExpenseDto): Promise<ExpenseResponseDto> {
    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);
    if (dto.supplierId) await this.assertSupplierExists(dto.supplierId);

    const expense = await this.prisma.expense.create({
      data: {
        categoryId: dto.categoryId ?? null,
        supplierId: dto.supplierId ?? null,
        amount: new Prisma.Decimal(dto.amount),
        date: dto.date ?? new Date(),
        status: dto.status ?? ExpenseStatus.PENDING,
        description: dto.description ?? null,
        attachments: [],
      },
    });

    return this.mapToResponse(expense);
  }

  async findAll(filter: ListExpensesFilter = {}): Promise<ExpenseResponseDto[]> {
    const where: Prisma.ExpenseWhereInput = {};

    if (filter.categoryId) where.categoryId = filter.categoryId;
    if (filter.supplierId) where.supplierId = filter.supplierId;
    if (filter.status) where.status = filter.status;
    if (filter.from || filter.to) {
      where.date = {};
      if (filter.from) where.date.gte = filter.from;
      if (filter.to) where.date.lte = filter.to;
    }

    const expenses = await this.prisma.expense.findMany({
      where,
      orderBy: { date: 'desc' },
      take: filter.limit ?? 50,
      skip: filter.offset ?? 0,
    });

    return expenses.map((expense) => this.mapToResponse(expense));
  }

  async findOne(id: string): Promise<ExpenseResponseDto> {
    const expense = await this.prisma.expense.findUnique({ where: { id } });
    if (!expense) {
      throw new NotFoundException(`Expense ${id} not found`);
    }
    return this.mapToResponse(expense);
  }

  async update(id: string, dto: UpdateExpenseDto): Promise<ExpenseResponseDto> {
    await this.findOne(id);

    if (dto.categoryId) await this.assertCategoryExists(dto.categoryId);
    if (dto.supplierId) await this.assertSupplierExists(dto.supplierId);

    const expense = await this.prisma.expense.update({
      where: { id },
      data: {
        ...(dto.categoryId !== undefined ? { categoryId: dto.categoryId } : {}),
        ...(dto.supplierId !== undefined ? { supplierId: dto.supplierId } : {}),
        ...(dto.amount !== undefined
          ? { amount: new Prisma.Decimal(dto.amount) }
          : {}),
        ...(dto.date !== undefined ? { date: dto.date } : {}),
        ...(dto.status !== undefined ? { status: dto.status } : {}),
        ...(dto.description !== undefined ? { description: dto.description } : {}),
      },
    });

    return this.mapToResponse(expense);
  }

  async remove(id: string): Promise<ExpenseResponseDto> {
    await this.findOne(id);
    const expense = await this.prisma.expense.delete({ where: { id } });
    return this.mapToResponse(expense);
  }

  async uploadReceipt(
    id: string,
    fileName: string,
    buffer: Buffer,
    contentType: string,
  ): Promise<{ key: string }> {
    await this.findOne(id);
    const key = await this.receiptStorage.appendReceipt(
      id,
      fileName,
      buffer,
      contentType,
    );
    return { key };
  }

  async getReceiptSignedUrl(expenseId: string, key: string): Promise<string> {
    return this.receiptStorage.getSignedUrl(expenseId, key);
  }

  private async assertCategoryExists(categoryId: string): Promise<void> {
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id: categoryId },
    });
    if (!category) {
      throw new NotFoundException(`Expense category ${categoryId} not found`);
    }
  }

  private async assertSupplierExists(supplierId: string): Promise<void> {
    const supplier = await this.prisma.supplier.findUnique({
      where: { id: supplierId },
    });
    if (!supplier) {
      throw new NotFoundException(`Supplier ${supplierId} not found`);
    }
  }

  private mapToResponse(expense: Expense): ExpenseResponseDto {
    return {
      id: expense.id,
      categoryId: expense.categoryId,
      supplierId: expense.supplierId,
      amount: Number(expense.amount),
      date: expense.date,
      status: expense.status,
      description: expense.description,
      attachmentKeys: this.receiptStorage.parseKeys(expense.attachments),
      createdAt: expense.createdAt,
      updatedAt: expense.updatedAt,
    };
  }
}
