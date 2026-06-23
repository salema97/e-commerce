import { Body, Controller, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { MarketingAutomationService } from './marketing-automation.service.js';
import { DistributePromoDto } from './dto/distribute-promo.dto.js';
import type { MarketingSegment } from './notification-segment.service.js';

@ApiTags('Marketing')
@ApiBearerAuth()
@Controller('marketing')
export class MarketingController {
  constructor(private readonly marketingAutomation: MarketingAutomationService) {}

  @Post('campaigns/promo')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Distribute promo codes to a customer segment' })
  distributePromo(@Body() dto: DistributePromoDto) {
    return this.marketingAutomation.distributePromoToSegment(
      dto.segment as MarketingSegment,
      dto.promotionId,
    );
  }
}
