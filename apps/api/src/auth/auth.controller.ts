import { Controller, Get } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { CurrentUser } from './current-user.decorator.js';
import { UserProvisioningService } from '../users/user-provisioning.service.js';

@ApiTags('Auth')
@ApiBearerAuth()
@Controller('auth')
export class AuthController {
  constructor(private readonly userProvisioning: UserProvisioningService) {}

  @Get('me')
  @ApiOperation({ summary: 'Get the authenticated user profile' })
  async getMe(@CurrentUser('userId') clerkUserId: string) {
    const user = await this.userProvisioning.ensureByClerkUserId(clerkUserId);

    return {
      id: user.id,
      clerkUserId: user.clerkUserId,
      email: user.email,
      name: user.name,
      phone: user.phone,
      role: user.role,
      emailOptOut: user.emailOptOut,
      marketingEmailOptOut: user.marketingEmailOptOut,
      whatsappOptOut: user.whatsappOptOut,
      createdAt: user.createdAt,
    };
  }
}
