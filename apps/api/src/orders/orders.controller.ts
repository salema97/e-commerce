import { Controller, Get, Post, Patch, Param, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { OrdersService } from './orders.service.js';
import { CreatePaymentIntentDto } from '../payments/dto/create-payment-intent.dto.js';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create an order (placeholder)' })
  @ApiResponse({ status: 201, description: 'Order placeholder' })
  create() {
    return this.ordersService.create();
  }

  @Get()
  @ApiOperation({ summary: 'List orders (placeholder)' })
  @ApiResponse({ status: 200, description: 'Order list placeholder' })
  findAll() {
    return this.ordersService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get an order (placeholder)' })
  @ApiResponse({ status: 200, description: 'Order placeholder' })
  findOne(@Param('id') id: string) {
    return this.ordersService.findOne(id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update order status (placeholder)' })
  @ApiResponse({ status: 200, description: 'Order status update placeholder' })
  updateStatus(@Param('id') id: string) {
    return this.ordersService.updateStatus(id);
  }

  @Post(':id/payment-intent')
  @Public()
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @ApiOperation({ summary: 'Create a payment intent for an order' })
  @ApiResponse({ status: 201, description: 'Payment intent created' })
  createPaymentIntent(
    @Param('id') orderId: string,
    @Body() dto: CreatePaymentIntentDto,
  ) {
    return this.ordersService.createPaymentIntent(orderId, dto);
  }
}
