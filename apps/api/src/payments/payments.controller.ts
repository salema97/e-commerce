import { Body, Controller, HttpCode, HttpStatus, Post } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { PaymentsService } from './payments.service.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { CreatePaymentIntentDto } from './dto/create-payment-intent.dto.js';

@ApiTags('Payments')
@Controller('payments')
export class PaymentsController {
  constructor(private readonly paymentsService: PaymentsService) {}

  @Post('intent')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Create a payment intent for an order' })
  @ApiResponse({ status: 200, description: 'Payment intent created' })
  @ApiResponse({ status: 400, description: 'Invalid input or order cannot be charged' })
  @ApiResponse({ status: 403, description: 'Order does not belong to the authenticated user' })
  @ApiResponse({ status: 404, description: 'Order not found' })
  @ApiBearerAuth()
  createPaymentIntent(
    @Body() dto: CreatePaymentIntentDto,
    @CurrentUser('userId') userId: string,
  ) {
    return this.paymentsService.createPaymentIntent(dto, userId);
  }
}
