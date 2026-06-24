import { Controller, Get, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { LoyaltyService } from './loyalty.service.js';

@ApiTags('Loyalty')
@Controller('loyalty')
export class LoyaltyController {
  constructor(private readonly loyaltyService: LoyaltyService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get current user loyalty account' })
  me(@CurrentUser('userId') userId: string) {
    return this.loyaltyService.getOrCreateAccount(userId);
  }

  @Get('me/transactions')
  @ApiOperation({ summary: 'List loyalty transactions' })
  transactions(@CurrentUser('userId') userId: string, @Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 50;
    return this.loyaltyService.listTransactions(userId, Number.isFinite(parsed) ? parsed : 50);
  }

  @Get('me/redemption-quote')
  @ApiOperation({ summary: 'Quote loyalty redemption for checkout' })
  quote(
    @CurrentUser('userId') userId: string,
    @Query('subtotal') subtotal: string,
    @Query('points') points?: string,
  ) {
    const orderSubtotal = Number(subtotal);
    const requestedPoints = points ? Number(points) : undefined;
    return this.loyaltyService.quoteRedemption(
      userId,
      Number.isFinite(orderSubtotal) ? orderSubtotal : 0,
      Number.isFinite(requestedPoints ?? NaN) ? requestedPoints : undefined,
    );
  }
}
