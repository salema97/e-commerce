import { BadRequestException, Controller, Get, Post, Patch, Body, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReviewStatus } from '@prisma/client';
import { Public } from '../auth/public.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Audit } from '../audit/audit.decorator.js';
import { ReviewsService } from './reviews.service.js';
import { CreateProductReviewDto, UpdateReviewStatusDto } from './dto/review.dto.js';
import { ExternalReviewsService } from './external-reviews.service.js';

@ApiTags('Reviews')
@Controller('reviews')
export class ReviewsController {
  constructor(
    private readonly reviewsService: ReviewsService,
    private readonly externalReviews: ExternalReviewsService,
  ) {}

  @Get('external/summary')
  @Public()
  @ApiOperation({ summary: 'External store review summary (Google/Trustpilot stub)' })
  externalSummary() {
    return this.externalReviews.getStoreSummary();
  }

  @Get('products/:productId')
  @Public()
  @ApiOperation({ summary: 'List approved reviews for a product' })
  listByProduct(@Param('productId') productId: string) {
    return this.reviewsService.listByProduct(productId, true);
  }

  @Get('products/:productId/summary')
  @Public()
  @ApiOperation({ summary: 'Product review aggregate summary' })
  summary(@Param('productId') productId: string) {
    return this.reviewsService.summary(productId);
  }

  @Post('products/:productId')
  @ApiOperation({ summary: 'Submit a product review' })
  create(
    @Param('productId') productId: string,
    @CurrentUser('userId') userId: string,
    @Body() dto: CreateProductReviewDto,
  ) {
    return this.reviewsService.create(productId, userId, dto);
  }

  @Get('moderation/pending')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'List pending reviews for moderation' })
  listPending(@Query('limit') limit?: string) {
    const parsed = limit ? Number(limit) : 50;
    return this.reviewsService.listPending(Number.isFinite(parsed) ? parsed : 50);
  }

  @Patch(':id/status')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'product_review', action: 'moderate' })
  @ApiOperation({ summary: 'Approve or reject a review' })
  moderate(@Param('id') id: string, @Body() dto: UpdateReviewStatusDto) {
    if (!Object.values(ReviewStatus).includes(dto.status)) {
      throw new BadRequestException('Invalid review status');
    }
    return this.reviewsService.moderate(id, dto.status);
  }
}
