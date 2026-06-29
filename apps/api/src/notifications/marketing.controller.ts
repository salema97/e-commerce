import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Logger,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { Audit } from '../audit/audit.decorator.js';
import { MarketingAutomationService } from './marketing-automation.service.js';
import { DistributePromoDto } from './dto/distribute-promo.dto.js';
import type { MarketingSegment } from './notification-segment.service.js';
import { MarketingPlacementService } from './marketing-placement.service.js';
import {
  ActivePlacementsQueryDto,
  AdminMarketingPlacementsQueryDto,
  CreateMarketingPlacementDto,
  UpdateMarketingPlacementDto,
} from './dto/marketing-placement.dto.js';

@ApiTags('Marketing')
@Controller('marketing')
export class MarketingController {
  private readonly logger = new Logger(MarketingController.name);

  constructor(
    private readonly marketingAutomation: MarketingAutomationService,
    private readonly marketingPlacements: MarketingPlacementService,
  ) {}

  @Get('promotions')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'List active promotions for campaign targeting' })
  listPromotions() {
    return this.marketingAutomation.listActivePromotions();
  }

  @Post('campaigns/promo')
  @HttpCode(202)
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'marketing_campaign', action: 'distribute_promo' })
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

  @Get('placements/active')
  @Public()
  @ApiOperation({ summary: 'Get active marketing placements for a platform' })
  findActivePlacements(@Query() query: ActivePlacementsQueryDto) {
    return this.marketingPlacements.resolveActive(query.platform);
  }

  @Get('placements/admin/list')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'List marketing placements (admin)' })
  listPlacementsAdmin(@Query() query: AdminMarketingPlacementsQueryDto) {
    return this.marketingPlacements.findAllAdmin(query);
  }

  @Get('placements/:id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get marketing placement by id (admin)' })
  findPlacementById(@Param('id') id: string) {
    return this.marketingPlacements.findById(id);
  }

  @Post('placements')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'marketing_placement', action: 'create' })
  @ApiOperation({ summary: 'Create marketing placement (admin)' })
  createPlacement(@Body() dto: CreateMarketingPlacementDto) {
    return this.marketingPlacements.create(dto);
  }

  @Patch('placements/:id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'marketing_placement', action: 'update' })
  @ApiOperation({ summary: 'Update marketing placement (admin)' })
  updatePlacement(@Param('id') id: string, @Body() dto: UpdateMarketingPlacementDto) {
    return this.marketingPlacements.update(id, dto);
  }

  @Delete('placements/:id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'marketing_placement', action: 'delete' })
  @ApiOperation({ summary: 'Delete marketing placement (admin)' })
  removePlacement(@Param('id') id: string) {
    return this.marketingPlacements.remove(id);
  }
}
