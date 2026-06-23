import { Body, Controller, Get, Post } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { ShippingService } from './shipping.service.js';
import { ShippingQuoteDto } from './dto/shipping-quote.dto.js';

@ApiTags('Shipping')
@Controller('shipping')
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post('quote')
  @Public()
  @ApiOperation({ summary: 'Quote shipping for a cart subtotal and destination' })
  @ApiResponse({ status: 200, description: 'Shipping quote' })
  quote(@Body() dto: ShippingQuoteDto) {
    return this.shippingService.quote(dto);
  }

  @Get('zones')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @ApiOperation({ summary: 'List active shipping zones (admin)' })
  @ApiResponse({ status: 200, description: 'Shipping zones' })
  listZones() {
    return this.shippingService.listZones();
  }
}
