import { Body, Controller, Get, HttpCode, Logger, Post } from '@nestjs/common';
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
  private readonly logger = new Logger(MarketingController.name);

  constructor(private readonly marketingAutomation: MarketingAutomationService) {}

  @Get('promotions')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'List active promotions for campaign targeting' })
  listPromotions() {
    return this.marketingAutomation.listActivePromotions();
  }

  @Post('campaigns/promo')
  @HttpCode(202)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Distribute promo codes to a customer segment' })
  distributePromo(@Body() dto: DistributePromoDto) {
    void this.marketingAutomation
      .distributePromoToSegment(dto.segment as MarketingSegment, dto.promotionId)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          { error: message, segment: dto.segment, promotionId: dto.promotionId },
          'Background promo distribution failed',
        );
      });

    return { status: 'queued' as const };
  }
}
