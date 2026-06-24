import { Body, Controller, Get, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MarketplaceDisputeStatus, SellerPayoutStatus, SellerStatus } from '@prisma/client';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Audit } from '../audit/audit.decorator.js';
import { SellersService } from './sellers.service.js';
import {
  CreateMarketplaceDisputeDto,
  CreateSellerDto,
  ResolveMarketplaceDisputeDto,
  UpdateSellerDto,
} from './dto/sellers.dto.js';

@ApiTags('Sellers')
@Controller('sellers')
export class SellersController {
  constructor(private readonly sellersService: SellersService) {}

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  listSellers(@Query('status') status?: SellerStatus) {
    return this.sellersService.listSellers(status);
  }

  @Post()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'seller', action: 'create' })
  createSeller(@Body() dto: CreateSellerDto) {
    return this.sellersService.createSeller(dto);
  }

  @Patch(':id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'seller', action: 'update' })
  updateSeller(@Param('id') id: string, @Body() dto: UpdateSellerDto) {
    return this.sellersService.updateSeller(id, dto);
  }

  @Get('payouts')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  listPayouts(
    @Query('sellerId') sellerId?: string,
    @Query('status') status?: SellerPayoutStatus,
  ) {
    return this.sellersService.listPayouts(sellerId, status);
  }

  @Post('payouts/:id/mark-paid')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @Audit({ resource: 'seller_payout', action: 'mark_paid' })
  markPayoutPaid(@Param('id') id: string) {
    return this.sellersService.markPayoutPaid(id);
  }

  @Get('disputes')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  listDisputes(@Query('status') status?: MarketplaceDisputeStatus) {
    return this.sellersService.listDisputes(status);
  }

  @Post('disputes')
  @ApiOperation({ summary: 'Open marketplace dispute' })
  openDispute(@CurrentUser('userId') userId: string, @Body() dto: CreateMarketplaceDisputeDto) {
    return this.sellersService.openDispute(userId, dto);
  }

  @Patch('disputes/:id/resolve')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'marketplace_dispute', action: 'resolve' })
  resolveDispute(@Param('id') id: string, @Body() dto: ResolveMarketplaceDisputeDto) {
    return this.sellersService.resolveDispute(id, dto);
  }
}
