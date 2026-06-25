import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ReferralPayoutMethod } from '@prisma/client';
import { Roles } from '../auth/roles.decorator.js';
import { Role } from '../auth/role.enum.js';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Audit } from '../audit/audit.decorator.js';
import { ReferralsService } from './referrals.service.js';

class PayoutReferralDto {
  payoutMethod!: ReferralPayoutMethod;
}

@ApiTags('Referrals')
@Controller('referrals')
export class ReferralsController {
  constructor(private readonly referralsService: ReferralsService) {}

  @Get('me/code')
  @ApiOperation({ summary: 'Get or create referral code for current user' })
  myCode(@CurrentUser('userId') userId: string) {
    return this.referralsService.getOrCreateCode(userId);
  }

  @Get('me/performance')
  @ApiOperation({ summary: 'Referral performance for current user' })
  myPerformance(@CurrentUser('userId') userId: string) {
    return this.referralsService.performanceReport(userId);
  }

  @Get('admin/performance')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN)
  @ApiOperation({ summary: 'Referral performance dashboard' })
  adminPerformance() {
    return this.referralsService.performanceReport();
  }

  @Post('admin/conversions/:id/payout')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @Audit({ resource: 'referral_conversion', action: 'payout' })
  @ApiOperation({ summary: 'Pay referral commission' })
  payout(@Param('id') id: string, @Body() dto: PayoutReferralDto) {
    return this.referralsService.payout(id, dto.payoutMethod);
  }
}
