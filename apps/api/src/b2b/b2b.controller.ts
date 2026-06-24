import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Audit } from '../audit/audit.decorator.js';
import { B2bService } from './b2b.service.js';
import {
  AddCompanyUserDto,
  BulkOrderImportDto,
  CreateCompanyDto,
  UpdateCompanyDto,
  UpsertCompanyPriceDto,
} from './dto/b2b.dto.js';

@ApiTags('B2B')
@Controller('b2b')
export class B2bController {
  constructor(private readonly b2bService: B2bService) {}

  @Get('companies')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'List B2B companies' })
  listCompanies() {
    return this.b2bService.listCompanies();
  }

  @Post('companies')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'company', action: 'create' })
  createCompany(@Body() dto: CreateCompanyDto) {
    return this.b2bService.createCompany(dto);
  }

  @Patch('companies/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @Audit({ resource: 'company', action: 'update' })
  updateCompany(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.b2bService.updateCompany(id, dto);
  }

  @Post('companies/:id/users')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  addUser(@Param('id') id: string, @Body() dto: AddCompanyUserDto) {
    return this.b2bService.addUser(id, dto.userId, dto.role);
  }

  @Get('companies/:id/prices')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  listPrices(@Param('id') id: string) {
    return this.b2bService.listPrices(id);
  }

  @Post('companies/:id/prices')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'company_price_list', action: 'upsert' })
  upsertPrice(@Param('id') id: string, @Body() dto: UpsertCompanyPriceDto) {
    return this.b2bService.upsertPrice(id, dto);
  }

  @Post('companies/:id/bulk-orders')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  bulkImport(@Param('id') id: string, @CurrentUser('userId') userId: string, @Body() dto: BulkOrderImportDto) {
    return this.b2bService.bulkImportQuote(id, userId, dto.rows);
  }

  @Get('me/company')
  @ApiOperation({ summary: 'Get current user B2B company membership' })
  myCompany(@CurrentUser('userId') userId: string) {
    return this.b2bService.myCompany(userId);
  }
}
