import { createHmac, timingSafeEqual } from 'node:crypto';
import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserProvisioningService } from '../users/user-provisioning.service.js';

export interface NotificationPreferences {
  emailOptOut: boolean;
  marketingEmailOptOut: boolean;
  whatsappOptOut: boolean;
}

@Injectable()
export class NotificationPreferencesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly userProvisioning: UserProvisioningService,
  ) {}

  async getByClerkUserId(clerkUserId: string): Promise<NotificationPreferences> {
    const user = await this.userProvisioning.ensureByClerkUserId(clerkUserId);
    return {
      emailOptOut: user.emailOptOut,
      marketingEmailOptOut: user.marketingEmailOptOut,
      whatsappOptOut: user.whatsappOptOut,
    };
  }

  async updateByClerkUserId(
    clerkUserId: string,
    data: Partial<NotificationPreferences>,
  ): Promise<NotificationPreferences> {
    const user = await this.userProvisioning.ensureByClerkUserId(clerkUserId);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailOptOut: data.emailOptOut,
        marketingEmailOptOut: data.marketingEmailOptOut,
        whatsappOptOut: data.whatsappOptOut,
      },
      select: {
        emailOptOut: true,
        marketingEmailOptOut: true,
        whatsappOptOut: true,
      },
    });
    return updated;
  }

  async unsubscribeMarketingByToken(token: string): Promise<void> {
    const userId = this.verifyUnsubscribeToken(token, 'marketing');
    await this.prisma.user.update({
      where: { id: userId },
      data: { marketingEmailOptOut: true },
    });
  }

  async unsubscribeTransactionalByToken(token: string): Promise<void> {
    const userId = this.verifyUnsubscribeToken(token, 'transactional');
    await this.prisma.user.update({
      where: { id: userId },
      data: { emailOptOut: true },
    });
  }

  createUnsubscribeToken(userId: string, scope: 'marketing' | 'transactional'): string {
    const secret = this.unsubscribeSecret();
    const payload = `${scope}:${userId}`;
    const signature = createHmac('sha256', secret).update(payload).digest('base64url');
    return Buffer.from(`${payload}:${signature}`).toString('base64url');
  }

  private verifyUnsubscribeToken(token: string, expectedScope: string): string {
    const decoded = Buffer.from(token, 'base64url').toString('utf8');
    const [scope, userId, signature] = decoded.split(':');
    if (!scope || !userId || !signature || scope !== expectedScope) {
      throw new NotFoundException('Invalid unsubscribe token');
    }

    const expected = createHmac('sha256', this.unsubscribeSecret())
      .update(`${scope}:${userId}`)
      .digest('base64url');

    const provided = Buffer.from(signature);
    const expectedBuffer = Buffer.from(expected);
    if (
      provided.length !== expectedBuffer.length ||
      !timingSafeEqual(provided, expectedBuffer)
    ) {
      throw new NotFoundException('Invalid unsubscribe token');
    }

    return userId;
  }

  private unsubscribeSecret(): string {
    return (
      this.configService.get<string>('NOTIFICATION_UNSUBSCRIBE_SECRET') ??
      this.configService.getOrThrow<string>('CLERK_WEBHOOK_SECRET')
    );
  }
}
