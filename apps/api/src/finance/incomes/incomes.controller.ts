import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { IncomeSource } from '@prisma/client';
import { IncomesService, ListIncomesFilter } from './incomes.service.js';
import { CreateIncomeDto } from './dto/create-income.dto.js';
import { UpdateIncomeDto } from './dto/update-income.dto.js';
import { IncomeResponseDto } from './dto/income-response.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/role.enum.js';
import { Audit } from '../../audit/audit.decorator.js';

const FINANCE_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE] as const;

@ApiTags('Finance — Incomes')
@ApiBearerAuth()
@Controller('finance/incomes')
export class IncomesController {
  constructor(private readonly incomesService: IncomesService) {}

  @Post()
  @Roles(...FINANCE_ROLES)
  @Audit({ resource: 'income', action: 'create' })
  @ApiOperation({ summary: 'Create an income record' })
  @ApiResponse({ status: 201, type: IncomeResponseDto })
  create(@Body() dto: CreateIncomeDto): Promise<IncomeResponseDto> {
    return this.incomesService.create(dto);
  }

  @Get()
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'List income records' })
  @ApiQuery({ name: 'source', required: false, enum: IncomeSource })
  @ApiQuery({ name: 'from', required: false })
  @ApiQuery({ name: 'to', required: false })
  @ApiQuery({ name: 'relatedOrderId', required: false })
  findAll(
    @Query('source') source?: IncomeSource,
    @Query('from') from?: string,
    @Query('to') to?: string,
    @Query('relatedOrderId') relatedOrderId?: string,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ): Promise<IncomeResponseDto[]> {
    const filter: ListIncomesFilter = {
      source,
      from: from ? new Date(from) : undefined,
      to: to ? new Date(to) : undefined,
      relatedOrderId,
      limit: limit ? Number(limit) : undefined,
      offset: offset ? Number(offset) : undefined,
    };
    return this.incomesService.findAll(filter);
  }

  @Get(':id')
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'Get income by id' })
  findOne(@Param('id') id: string): Promise<IncomeResponseDto> {
    return this.incomesService.findOne(id);
  }

  @Patch(':id')
  @Roles(...FINANCE_ROLES)
  @Audit({ resource: 'income', action: 'update' })
  @ApiOperation({ summary: 'Update an income record' })
  update(
    @Param('id') id: string,
    @Body() dto: UpdateIncomeDto,
  ): Promise<IncomeResponseDto> {
    return this.incomesService.update(id, dto);
  }

  @Delete(':id')
  @Roles(...FINANCE_ROLES)
  @Audit({ resource: 'income', action: 'delete' })
  @ApiOperation({ summary: 'Delete an income record' })
  remove(@Param('id') id: string): Promise<IncomeResponseDto> {
    return this.incomesService.remove(id);
  }
}
