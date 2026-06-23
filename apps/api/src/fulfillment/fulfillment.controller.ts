import { Body, Controller, Get, Header, Param, Patch, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { FulfillmentService } from './fulfillment.service.js';
import { WmsIntegrationService } from './wms-integration.service.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { WmsImportTrackingDto, WmsSyncInventoryDto } from './dto/wms-sync.dto.js';

@ApiTags('Fulfillment')
@Controller('fulfillment')
export class FulfillmentController {
  constructor(
    private readonly fulfillmentService: FulfillmentService,
    private readonly wmsIntegrationService: WmsIntegrationService,
  ) {}

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

  @Get('shipments/:shipmentId/label')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @ApiBearerAuth()
  @Header('Content-Type', 'text/html; charset=utf-8')
  @ApiOperation({ summary: 'Printable shipping label HTML' })
  async printLabel(@Param('shipmentId') shipmentId: string) {
    return this.fulfillmentService.getLabelHtml(shipmentId);
  }

  @Get('orders/:orderId/tracking')
  @Public()
  @ApiOperation({ summary: 'Public order tracking by order id' })
  getTracking(@Param('orderId') orderId: string) {
    return this.fulfillmentService.listShipments(orderId);
  }

  @Get('wms/providers')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List evaluated WMS/3PL providers' })
  listWmsProviders() {
    return this.wmsIntegrationService.listProviders();
  }

  @Post('wms/sync-inventory')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync inventory levels from WMS payload' })
  syncInventory(@Body() dto: WmsSyncInventoryDto) {
    return this.wmsIntegrationService.syncInventory(dto.records);
  }

  @Post('wms/import-tracking')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Import tracking events from WMS/3PL' })
  importTracking(@Body() dto: WmsImportTrackingDto) {
    return this.wmsIntegrationService.importTracking(dto.events);
  }

  @Get('backorders')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List open backorder lines' })
  listBackorders() {
    return this.wmsIntegrationService.listBackorders();
  }
}
