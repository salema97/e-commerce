import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { MarketplaceChannel } from '@prisma/client';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { Audit } from '../audit/audit.decorator.js';
import { MarketplaceService } from './marketplace.service.js';
import { MarketplaceImportOrderDto } from './dto/marketplace.dto.js';

@ApiTags('Marketplace')
@Controller('marketplace')
export class MarketplaceController {
  constructor(private readonly marketplaceService: MarketplaceService) {}

  @Get('channels')
  @ApiOperation({ summary: 'List marketplace channel profiles' })
  channels() {
    return this.marketplaceService.listProfiles();
  }

  @Get('listings')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  listings(@Query('channel') channel?: MarketplaceChannel) {
    return this.marketplaceService.listListings(channel);
  }

  @Post('products/:productId/sync')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'marketplace_listing', action: 'sync' })
  syncProduct(@Param('productId') productId: string, @Query('channel') channel?: MarketplaceChannel) {
    return this.marketplaceService.syncProduct(productId, channel);
  }

  @Post('orders/import')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'marketplace_order', action: 'import' })
  importOrder(@Body() dto: MarketplaceImportOrderDto) {
    return this.marketplaceService.importOrder(dto);
  }
}
