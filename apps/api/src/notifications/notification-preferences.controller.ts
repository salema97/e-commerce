import { Body, Controller, Get, Patch, Post, Query } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { Public } from '../auth/public.decorator.js';
import { NotificationPreferencesService } from './notification-preferences.service.js';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto.js';

@ApiTags('Notifications')
@Controller('notifications')
export class NotificationPreferencesController {
  constructor(private readonly preferencesService: NotificationPreferencesService) {}

  @Get('preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get notification consent preferences for the current user' })
  getPreferences(@CurrentUser('userId') clerkUserId: string) {
    return this.preferencesService.getByClerkUserId(clerkUserId);
  }

  @Patch('preferences')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update notification consent preferences' })
  updatePreferences(
    @CurrentUser('userId') clerkUserId: string,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    return this.preferencesService.updateByClerkUserId(clerkUserId, dto);
  }

  @Post('unsubscribe')
  @Public()
  @ApiOperation({ summary: 'One-click unsubscribe using a signed token' })
  async unsubscribe(
    @Query('token') token: string,
    @Query('scope') scope: 'marketing' | 'transactional' = 'marketing',
  ): Promise<{ success: true }> {
    if (scope === 'transactional') {
      await this.preferencesService.unsubscribeTransactionalByToken(token);
    } else {
      await this.preferencesService.unsubscribeMarketingByToken(token);
    }
    return { success: true };
  }
}
