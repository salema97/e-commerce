import { Controller, Get } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { FinanceStoreCreditsService } from './finance-store-credits.service.js';
import { AdminStoreCreditDto } from './dto/admin-store-credit.dto.js';
import { Roles } from '../../auth/roles.decorator.js';
import { Role } from '../../auth/role.enum.js';

const FINANCE_ROLES = [Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE] as const;

@ApiTags('Finance — Store Credits')
@ApiBearerAuth()
@Controller('finance/store-credits')
export class FinanceStoreCreditsController {
  constructor(private readonly storeCreditsService: FinanceStoreCreditsService) {}

  @Get()
  @Roles(...FINANCE_ROLES)
  @ApiOperation({ summary: 'List store credit balances (read-only)' })
  findAll(): Promise<AdminStoreCreditDto[]> {
    return this.storeCreditsService.findAll();
  }
}
