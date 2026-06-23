import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { RegisterPushTokenDto } from './dto/register-push-token.dto.js';

@Injectable()
export class PushTokensService {
  constructor(private readonly prisma: PrismaService) {}

  async register(userId: string, dto: RegisterPushTokenDto) {
    return this.prisma.pushDeviceToken.upsert({
      where: { token: dto.token },
      create: {
        userId,
        token: dto.token,
        platform: dto.platform,
      },
      update: {
        userId,
        platform: dto.platform,
      },
    });
  }

  async remove(userId: string, token: string): Promise<void> {
    await this.prisma.pushDeviceToken.deleteMany({
      where: { userId, token },
    });
  }
}
