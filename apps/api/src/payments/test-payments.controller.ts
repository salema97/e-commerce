import { Controller, Post, Body } from '@nestjs/common';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CreateTestPaymentDto } from './dto/create-test-payment.dto.js';
import { TestPaymentsService } from './test-payments.service.js';

@Controller('test/payments')
@Roles(Role.SUPER_ADMIN, Role.ADMIN)
export class TestPaymentsController {
  constructor(private readonly testPaymentsService: TestPaymentsService) {}

  @Post()
  create(@Body() dto: CreateTestPaymentDto) {
    return this.testPaymentsService.create(dto);
  }
}
