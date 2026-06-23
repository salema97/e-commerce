import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserProvisioningService } from '../users/user-provisioning.service.js';
import { RegisterPushTokenDto } from './dto/register-push-token.dto.js';

@Injectable()
export class PushTokensService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userProvisioning: UserProvisioningService,
  ) {}

  async register(clerkUserId: string, dto: RegisterPushTokenDto) {
    const user = await this.userProvisioning.ensureByClerkUserId(clerkUserId);

    return this.prisma.pushDeviceToken.upsert({
      where: { token: dto.token },
      create: {
        userId: user.id,
        token: dto.token,
        platform: dto.platform,
      },
      update: {
        userId: user.id,
        platform: dto.platform,
      },
    });
  }

  async remove(clerkUserId: string, token: string): Promise<void> {
    const user = await this.prisma.user.findUnique({
      where: { clerkUserId },
      select: { id: true },
    });

    if (!user) {
      return;
    }

    await this.prisma.pushDeviceToken.deleteMany({
      where: { userId: user.id, token },
    });
  }
}
