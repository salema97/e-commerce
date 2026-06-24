import { Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { AccountingService } from './accounting.service.js';

@ApiTags('Accounting')
@Controller('accounting')
export class AccountingController {
  constructor(private readonly accountingService: AccountingService) {}

  @Get('providers')
  @ApiOperation({ summary: 'List accounting provider profiles' })
  providers() {
    return this.accountingService.listProfiles();
  }

  @Get('sync-records')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  syncRecords() {
    return this.accountingService.listSyncRecords();
  }

  @Post('invoices/:id/sync')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Push authorized invoice to accounting provider' })
  syncInvoice(@Param('id') id: string) {
    return this.accountingService.syncAuthorizedInvoice(id);
  }

  @Get('marketplace-fees')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'List marketplace fee reconciliations' })
  marketplaceFees() {
    return this.accountingService.listMarketplaceFeeReconciliations();
  }

  @Post('marketplace-fees/:orderId/sync')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Push marketplace fees to accounting provider' })
  syncMarketplaceFee(@Param('orderId') orderId: string) {
    return this.accountingService.syncMarketplaceFee(orderId);
  }
}
