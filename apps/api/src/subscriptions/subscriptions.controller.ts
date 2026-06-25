import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Public } from '../auth/public.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Audit } from '../audit/audit.decorator.js';
import { SubscriptionsService } from './subscriptions.service.js';
import {
  CreateSubscriptionPlanDto,
  SubscribeDto,
  UpdateSubscriptionPlanDto,
} from './dto/subscriptions.dto.js';

@ApiTags('Subscriptions')
@Controller('subscriptions')
export class SubscriptionsController {
  constructor(private readonly subscriptionsService: SubscriptionsService) {}

  @Get('plans')
  @Public()
  @ApiOperation({ summary: 'List subscription plans' })
  listPlans() {
    return this.subscriptionsService.listPlans();
  }

  @Post('plans')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'subscription_plan', action: 'create' })
  createPlan(@Body() dto: CreateSubscriptionPlanDto) {
    return this.subscriptionsService.createPlan(dto);
  }

  @Patch('plans/:id')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @Audit({ resource: 'subscription_plan', action: 'update' })
  updatePlan(@Param('id') id: string, @Body() dto: UpdateSubscriptionPlanDto) {
    return this.subscriptionsService.updatePlan(id, dto);
  }

  @Get('me')
  @ApiOperation({ summary: 'List my subscriptions' })
  mySubscriptions(@CurrentUser('userId') userId: string) {
    return this.subscriptionsService.listMySubscriptions(userId);
  }

  @Post('subscribe')
  @ApiOperation({ summary: 'Start Stripe subscription checkout' })
  subscribe(@CurrentUser('userId') userId: string, @Body() dto: SubscribeDto) {
    return this.subscriptionsService.subscribe(userId, dto.planId);
  }

  @Post('portal')
  @ApiOperation({ summary: 'Stripe customer billing portal (pause/cancel/upgrade)' })
  portal(@CurrentUser('userId') userId: string) {
    return this.subscriptionsService.billingPortal(userId);
  }
}
