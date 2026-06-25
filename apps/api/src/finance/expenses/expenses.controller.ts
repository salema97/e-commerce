import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  Res,
  HttpStatus,
} from '@nestjs/common';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { ExpenseStatus } from '@prisma/client';
import { ExpensesService, ListExpensesFilter } from './expenses.service.js';
import {
  CreateExpenseDto,
  ExpenseResponseDto,
  UpdateExpenseDto,
  UploadExpenseReceiptDto,
} from './dto/expense.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/role.enum.js';
import { Audit } from '../../audit/audit.decorator.js';
import { FINANCE_ROLES } from '../finance.constants.js';

@ApiTags('Finance — Expenses')
@ApiBearerAuth()
@Controller('finance/expenses')
export class ExpensesController {
  constructor(private readonly expensesService: ExpensesService) {}

  @Post()
  @Roles(...FINANCE_ROLES)
  @Audit({ resource: 'expense', action: 'create' })
  create(@Body() dto: CreateExpenseDto): Promise<ExpenseResponseDto> {
    return this.expensesService.create(dto);
  }

  @Get()
  @Roles(...FINANCE_ROLES)
  @ApiQuery({ name: 'status', required: false, enum: ExpenseStatus })
  findAll(
    @Query('categoryId') categoryId?: string,
    @Query('supplierId') supplierId?: string,
    @Query('status') status?: ExpenseStatus,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<ExpenseResponseDto[]> {
    const filter: ListExpensesFilter = {
      categoryId,
      supplierId,
      status,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    };
    return this.expensesService.findAll(filter);
  }

  @Get(':id')
  @Roles(...FINANCE_ROLES)
  findOne(@Param('id') id: string): Promise<ExpenseResponseDto> {
    return this.expensesService.findOne(id);
  }

  @Patch(':id')
  @Roles(...FINANCE_ROLES)
  @Audit({ resource: 'expense', action: 'update' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateExpenseDto,
  ): Promise<ExpenseResponseDto> {
    return this.expensesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...FINANCE_ROLES)
  @Audit({ resource: 'expense', action: 'delete' })
  remove(@Param('id') id: string): Promise<ExpenseResponseDto> {
    return this.expensesService.remove(id);
  }

  @Post(':id/receipts')
  @Roles(...FINANCE_ROLES)
  @Audit({ resource: 'expense', action: 'upload_receipt' })
  @ApiOperation({ summary: 'Upload an expense receipt to S3' })
  async uploadReceipt(
    @Param('id') id: string,
    @Body() dto: UploadExpenseReceiptDto,
  ): Promise<{ key: string }> {
    const buffer = Buffer.from(dto.contentBase64, 'base64');
    return this.expensesService.uploadReceipt(
      id,
      dto.fileName,
      buffer,
      dto.contentType ?? 'application/pdf',
    );
  }

  @Get(':id/receipts/download')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Redirect to signed receipt URL' })
  @ApiQuery({ name: 'key', required: true })
  async downloadReceipt(
    @Param('id') id: string,
    @Query('key') key: string,
    @Res() res: Response,
  ): Promise<void> {
    const url = await this.expensesService.getReceiptSignedUrl(id, key);
    res.redirect(HttpStatus.FOUND, url);
  }
}
