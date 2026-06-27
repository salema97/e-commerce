import { Body, Controller, Get, Header, Param, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Audit } from '../audit/audit.decorator.js';
import { Public } from '../auth/public.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { FulfillmentService } from './fulfillment.service.js';
import { WmsIntegrationService } from './wms-integration.service.js';
import { CreateShipmentDto } from './dto/create-shipment.dto.js';
import { ListShipmentsQueryDto } from './dto/list-shipments-query.dto.js';
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
  @Audit({ resource: 'shipment', action: 'create' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a shipment for an order (admin)' })
  @ApiResponse({ status: 201, description: 'Shipment created' })
  createShipment(
    @Param('orderId') orderId: string,
    @Body() dto: CreateShipmentDto,
  ) {
    return this.fulfillmentService.createShipment(orderId, dto);
  }

  @Post('orders/:orderId/shipments/servientrega')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'shipment', action: 'create_servientrega' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a Servientrega guide and shipment for an order' })
  @ApiResponse({ status: 201, description: 'Servientrega shipment created' })
  createServientregaShipment(@Param('orderId') orderId: string) {
    return this.fulfillmentService.createServientregaShipment(orderId);
  }

  @Post('shipments/:shipmentId/servientrega/sync-tracking')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY, Role.SUPPORT)
  @Audit({ resource: 'shipment', action: 'sync_servientrega_tracking' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync Servientrega tracking for one shipment' })
  syncServientregaShipmentTracking(@Param('shipmentId') shipmentId: string) {
    return this.fulfillmentService.syncServientregaShipmentTracking(shipmentId);
  }

  @Post('servientrega/sync-tracking')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'shipment', action: 'sync_servientrega_tracking_batch' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync Servientrega tracking for active shipments' })
  syncServientregaActiveTracking() {
    return this.fulfillmentService.syncServientregaActiveTracking();
  }

  @Get('shipments')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY, Role.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List all shipments (admin)' })
  listAllShipments(@Query() query: ListShipmentsQueryDto) {
    return this.fulfillmentService.listAllShipments(query);
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
  @Audit({ resource: 'shipment', action: 'mark_delivered' })
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
  @Audit({ resource: 'wms_inventory', action: 'sync' })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Sync inventory levels from WMS payload' })
  syncInventory(@Body() dto: WmsSyncInventoryDto) {
    return this.wmsIntegrationService.syncInventory(dto.records);
  }

  @Post('wms/import-tracking')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @Audit({ resource: 'shipment', action: 'import_tracking' })
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
