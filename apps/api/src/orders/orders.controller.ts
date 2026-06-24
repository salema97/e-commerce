import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Body,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { OrdersService } from './orders.service.js';
import { RefundService } from '../payments/refund.service.js';
import { ReceiptService } from '../receipts/receipt.service.js';
import { CreateOrderDto, UpdateOrderStatusDto } from './dto/create-order.dto.js';
import { ListOrdersQueryDto } from './dto/list-orders.query.dto.js';
import { CreateRefundDto } from '../payments/dto/create-refund.dto.js';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(
    private readonly ordersService: OrdersService,
    private readonly refundService: RefundService,
    private readonly receiptService: ReceiptService,
  ) {}

  @Post()
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({ status: 201, description: 'Order created' })
  @ApiResponse({ status: 400, description: 'Invalid input or insufficient stock' })
  create(
    @Body() dto: CreateOrderDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.ordersService.createOrder(userId, dto);
  }

  @Get()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List orders (admin)' })
  @ApiResponse({ status: 200, description: 'Paginated orders' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  listOrders(@Query() query: ListOrdersQueryDto) {
    return this.ordersService.listOrders(query);
  }

  @Get(':id')
  @Public()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get an order by id' })
  @ApiResponse({ status: 200, description: 'Order found' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  getOrderById(@Param('id') id: string) {
    return this.ordersService.getOrderById(id);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.INVENTORY)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update order status (admin)' })
  @ApiResponse({ status: 200, description: 'Order status updated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  updateOrderStatus(
    @Param('id') id: string,
    @Body() dto: UpdateOrderStatusDto,
  ) {
    return this.ordersService.updateOrderStatus(id, dto.status);
  }

  @Post(':id/cancel')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Cancel an order' })
  @ApiResponse({ status: 200, description: 'Order cancelled' })
  @HttpCode(HttpStatus.OK)
  cancelOrder(
    @Param('id') id: string,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.ordersService.cancelOrder(id, userId);
  }

  @Post(':id/refunds')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @Throttle({ default: { limit: 20, ttl: 3600_000 } })
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a refund for an order (admin/finance)' })
  @ApiResponse({ status: 201, description: 'Refund created' })
  @ApiResponse({ status: 400, description: 'Refund cannot be processed' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @HttpCode(HttpStatus.CREATED)
  createRefund(
    @Param('id') id: string,
    @Body() dto: CreateRefundDto,
    @CurrentUser('userId') userId?: string,
  ) {
    return this.refundService.createRefund({
      orderId: id,
      amount: dto.amount,
      type: dto.type,
      reason: dto.reason,
      requestedById: userId,
    });
  }

  @Get(':id/refunds')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'List refunds for an order' })
  @ApiResponse({ status: 200, description: 'Refunds list' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  listRefunds(@Param('id') id: string) {
    return this.refundService.listRefunds(id);
  }

  @Post(':id/receipt')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Generate a receipt for an order (admin)' })
  @ApiResponse({ status: 201, description: 'Receipt generated' })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @HttpCode(HttpStatus.CREATED)
  generateReceipt(@Param('id') id: string) {
    return this.receiptService.generateReceipt(id);
  }

  @Get(':id/receipt')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE, Role.SUPPORT)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a receipt for an order' })
  @ApiResponse({ status: 200, description: 'Receipt found' })
  getReceipt(@Param('id') id: string) {
    return this.receiptService.getReceipt(id);
  }
}
