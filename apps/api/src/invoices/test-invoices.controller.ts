import { Controller, Post, Body } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CreateTestInvoiceDto } from './dto/create-test-invoice.dto.js';
import { TestInvoicesService } from './test-invoices.service.js';

@Controller('test/invoices')
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
export class TestInvoicesController {
  constructor(private readonly testInvoicesService: TestInvoicesService) {}

  @Post()
  create(@Body() dto: CreateTestInvoiceDto) {
    return this.testInvoicesService.create(dto);
  }
}
