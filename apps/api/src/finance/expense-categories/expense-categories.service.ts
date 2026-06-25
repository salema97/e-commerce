import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { ExpenseCategory, Prisma } from '@prisma/client';
import { PrismaService } from '../../prisma/prisma.service.js';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto.js';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto.js';
import { ExpenseCategoryResponseDto } from './dto/expense-category-response.dto.js';

@Injectable()
export class ExpenseCategoriesService {
  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateExpenseCategoryDto): Promise<ExpenseCategoryResponseDto> {
    try {
      const category = await this.prisma.expenseCategory.create({
        data: {
          name: dto.name.trim(),
          description: dto.description ?? null,
        },
      });
      return this.mapToResponse(category);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Expense category "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async findAll(): Promise<ExpenseCategoryResponseDto[]> {
    const categories = await this.prisma.expenseCategory.findMany({
      orderBy: { name: 'asc' },
    });
    return categories.map((category) => this.mapToResponse(category));
  }

  async findOne(id: string): Promise<ExpenseCategoryResponseDto> {
    const category = await this.prisma.expenseCategory.findUnique({
      where: { id },
    });
    if (!category) {
      throw new NotFoundException(`Expense category ${id} not found`);
    }
    return this.mapToResponse(category);
  }

  async update(
    id: string,
    dto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    await this.findOne(id);

    try {
      const category = await this.prisma.expenseCategory.update({
        where: { id },
        data: {
          ...(dto.name !== undefined ? { name: dto.name.trim() } : {}),
          ...(dto.description !== undefined ? { description: dto.description } : {}),
        },
      });
      return this.mapToResponse(category);
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === 'P2002'
      ) {
        throw new ConflictException(`Expense category "${dto.name}" already exists`);
      }
      throw error;
    }
  }

  async remove(id: string): Promise<ExpenseCategoryResponseDto> {
    await this.findOne(id);
    const category = await this.prisma.expenseCategory.delete({ where: { id } });
    return this.mapToResponse(category);
  }

  private mapToResponse(category: ExpenseCategory): ExpenseCategoryResponseDto {
    return {
      id: category.id,
      name: category.name,
      description: category.description,
      createdAt: category.createdAt,
      updatedAt: category.updatedAt,
    };
  }
}
