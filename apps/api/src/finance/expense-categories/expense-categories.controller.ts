import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ExpenseCategoriesService } from './expense-categories.service.js';
import { CreateExpenseCategoryDto } from './dto/create-expense-category.dto.js';
import { UpdateExpenseCategoryDto } from './dto/update-expense-category.dto.js';
import { ExpenseCategoryResponseDto } from './dto/expense-category-response.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/role.enum.js';
import { Audit } from '../../audit/audit.decorator.js';
import { FINANCE_ROLES } from '../finance.constants.js';

@ApiTags('Finance — Expense Categories')
@ApiBearerAuth()
@Controller('finance/expense-categories')
export class ExpenseCategoriesController {
  constructor(
    private readonly expenseCategoriesService: ExpenseCategoriesService,
  ) {}

  @Post()
  @Roles(...FINANCE_ROLES)
  @Audit({ resource: 'expense_category', action: 'create' })
  @ApiOperation({ summary: 'Create an expense category' })
  @ApiResponse({ status: 201, type: ExpenseCategoryResponseDto })
  create(
    @Body() dto: CreateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.create(dto);
  }

  @Get()
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'List expense categories' })
  findAll(): Promise<ExpenseCategoryResponseDto[]> {
    return this.expenseCategoriesService.findAll();
  }

  @Get(':id')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Get expense category by id' })
  findOne(@Param('id') id: string): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.findOne(id);
  }

  @Patch(':id')
  @Roles(...FINANCE_ROLES)
  @Audit({ resource: 'expense_category', action: 'update' })
  @ApiOperation({ summary: 'Update an expense category' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseCategoryDto,
  ): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...FINANCE_ROLES)
  @Audit({ resource: 'expense_category', action: 'delete' })
  @ApiOperation({ summary: 'Delete an expense category' })
  remove(@Param('id') id: string): Promise<ExpenseCategoryResponseDto> {
    return this.expenseCategoriesService.remove(id);
  }
}
