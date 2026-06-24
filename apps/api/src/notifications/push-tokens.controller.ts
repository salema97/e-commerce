import { Body, Controller, Delete, Param, Post } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from '../auth/current-user.decorator.js';
import { PushTokensService } from './push-tokens.service.js';
import { RegisterPushTokenDto } from './dto/register-push-token.dto.js';

@ApiTags('Notifications')
@ApiBearerAuth()
@Controller('notifications/push-tokens')
export class PushTokensController {
  constructor(private readonly pushTokensService: PushTokensService) {}

  @Post()
  @ApiOperation({ summary: 'Register or refresh an Expo push token for the current user' })
  register(
    @CurrentUser('userId') userId: string,
    @Body() dto: RegisterPushTokenDto,
  ) {
    return this.pushTokensService.register(userId, dto);
  }

  @Delete(':token')
  @ApiOperation({ summary: 'Remove a push token for the current user' })
  async remove(
    @CurrentUser('userId') userId: string,
    @Param('token') token: string,
  ): Promise<void> {
    await this.pushTokensService.remove(userId, decodeURIComponent(token));
  }
}
