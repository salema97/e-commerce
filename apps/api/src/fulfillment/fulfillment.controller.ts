import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { FulfillmentService } from './fulfillment.service.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';

@ApiTags('Fulfillment')
@Controller('fulfillment')
export class FulfillmentController {
  constructor(private readonly fulfillmentService: FulfillmentService) {}

  @Post('orders/:orderId/shipments')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a shipment for an order (admin)' })
  @ApiResponse({ status: 201, description: 'Shipment created' })
  createShipment(
    @Param('orderId') orderId: string,
    @Body() dto: CreateShipmentDto,
  ) {
    return this.fulfillmentService.createShipment(orderId, dto);
  }

  @Get('orders/:orderId/shipments')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY, Role.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List shipments for an order' })
  listShipments(@Param('orderId') orderId: string) {
    return this.fulfillmentService.listShipments(orderId);
  }

  @Patch('shipments/:shipmentId/delivered')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Mark a shipment as delivered' })
  markDelivered(@Param('shipmentId') shipmentId: string) {
    return this.fulfillmentService.markDelivered(shipmentId);
  }

  @Get('orders/:orderId/tracking')
  @Public()
  @ApiOperation({ summary: 'Public order tracking by order id' })
  getTracking(@Param('orderId') orderId: string) {
    return this.fulfillmentService.listShipments(orderId);
  }
}
