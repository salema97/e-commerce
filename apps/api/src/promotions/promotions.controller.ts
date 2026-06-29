import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { Audit } from '../audit/audit.decorator.js';
import { PromotionsService } from './promotions.service.js';
import { CreatePromotionDto } from './dto/create-promotion.dto.js';
import { UpdatePromotionDto } from './dto/update-promotion.dto.js';
import { PromotionsQueryDto } from './dto/promotions-query.dto.js';
import {
  CreatePromotionCouponDto,
  UpdatePromotionCouponDto,
} from './dto/promotion-coupon.dto.js';
import {
  CreatePromotionDiscountRuleDto,
  UpdatePromotionDiscountRuleDto,
} from './dto/promotion-discount-rule.dto.js';

@ApiTags('Promotions')
@Controller('promotions')
export class PromotionsController {
  constructor(private readonly promotions: PromotionsService) {}

  @Get()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'List promotions' })
  findAll(@Query() query: PromotionsQueryDto) {
    return this.promotions.findAll(query);
  }

  @Post()
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'promotion', action: 'create' })
  @ApiOperation({ summary: 'Create promotion' })
  create(@Body() dto: CreatePromotionDto) {
    return this.promotions.create(dto);
  }

  @Patch('coupons/:couponId')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'coupon', action: 'update' })
  @ApiOperation({ summary: 'Update coupon' })
  updateCoupon(@Param('couponId') couponId: string, @Body() dto: UpdatePromotionCouponDto) {
    return this.promotions.updateCoupon(couponId, dto);
  }

  @Delete('coupons/:couponId')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'coupon', action: 'delete' })
  @ApiOperation({ summary: 'Delete coupon' })
  removeCoupon(@Param('couponId') couponId: string) {
    return this.promotions.removeCoupon(couponId);
  }

  @Patch('rules/:ruleId')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'discount_rule', action: 'update' })
  @ApiOperation({ summary: 'Update discount rule' })
  updateDiscountRule(
    @Param('ruleId') ruleId: string,
    @Body() dto: UpdatePromotionDiscountRuleDto,
  ) {
    return this.promotions.updateDiscountRule(ruleId, dto);
  }

  @Delete('rules/:ruleId')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'discount_rule', action: 'delete' })
  @ApiOperation({ summary: 'Delete discount rule' })
  removeDiscountRule(@Param('ruleId') ruleId: string) {
    return this.promotions.removeDiscountRule(ruleId);
  }

  @Get(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Get promotion by id with coupons and rules' })
  findOne(@Param('id') id: string) {
    return this.promotions.findOne(id);
  }

  @Patch(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'promotion', action: 'update' })
  @ApiOperation({ summary: 'Update promotion' })
  update(@Param('id') id: string, @Body() dto: UpdatePromotionDto) {
    return this.promotions.update(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'promotion', action: 'delete' })
  @ApiOperation({ summary: 'Delete promotion' })
  remove(@Param('id') id: string) {
    return this.promotions.remove(id);
  }

  @Post(':id/coupons')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'coupon', action: 'create' })
  @ApiOperation({ summary: 'Create coupon for promotion' })
  createCoupon(@Param('id') promotionId: string, @Body() dto: CreatePromotionCouponDto) {
    return this.promotions.createCoupon(promotionId, dto);
  }

  @Post(':id/rules')
  @ApiBearerAuth()
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'discount_rule', action: 'create' })
  @ApiOperation({ summary: 'Create discount rule for promotion' })
  createDiscountRule(
    @Param('id') promotionId: string,
    @Body() dto: CreatePromotionDiscountRuleDto,
  ) {
    return this.promotions.createDiscountRule(promotionId, dto);
  }
}
