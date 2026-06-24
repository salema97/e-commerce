import { Body, Controller, Delete, Get, Patch } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PrivacyService } from './privacy.service.js';
import { UpdateCcpaOptOutDto } from './dto/privacy.dto.js';

@ApiTags('Privacy')
@Controller('privacy')
export class PrivacyController {
  constructor(private readonly privacyService: PrivacyService) {}

  @Get('me/export')
  @ApiOperation({ summary: 'Export personal data (GDPR)' })
  exportMine(@CurrentUser('userId') clerkUserId: string) {
    return this.privacyService.exportUserData(clerkUserId);
  }

  @Delete('me')
  @ApiOperation({ summary: 'Request account data deletion / anonymization (GDPR)' })
  deleteMine(@CurrentUser('userId') clerkUserId: string) {
    return this.privacyService.deleteUserData(clerkUserId);
  }

  @Patch('me/ccpa-opt-out')
  @ApiOperation({ summary: 'CCPA do-not-sell / share preference' })
  ccpaOptOut(@CurrentUser('userId') clerkUserId: string, @Body() dto: UpdateCcpaOptOutDto) {
    return this.privacyService.setCcpaOptOut(clerkUserId, dto.optOut);
  }
}
