import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClerkClient } from '@clerk/backend';
import type { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../auth/role.enum.js';

/**
 * Ensures a Prisma User row exists for an authenticated Clerk user.
 * Used when webhooks have not yet synced the account (e.g. first API call).
 */
@Injectable()
export class UserProvisioningService {
  private readonly logger = new Logger(UserProvisioningService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {}

  async ensureByClerkUserId(clerkUserId: string): Promise<User> {
    const existing = await this.prisma.user.findUnique({ where: { clerkUserId } });
    if (existing) {
      return existing;
    }

    const clerk = createClerkClient({
      secretKey: this.configService.getOrThrow<string>('CLERK_SECRET_KEY'),
    });

    const clerkUser = await clerk.users.getUser(clerkUserId);
    const email =
      clerkUser.emailAddresses.find((entry) => entry.id === clerkUser.primaryEmailAddressId)
        ?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress;

    if (!email) {
      throw new NotFoundException('Clerk user has no email address');
    }

    const phone =
      clerkUser.phoneNumbers.find((entry) => entry.id === clerkUser.primaryPhoneNumberId)
        ?.phoneNumber ?? clerkUser.phoneNumbers[0]?.phoneNumber ?? null;

    const metadata = clerkUser.publicMetadata as { role?: string; identification?: string };
    const role = this.validateRole(metadata?.role);
    const name =
      [clerkUser.firstName, clerkUser.lastName].filter(Boolean).join(' ').trim() || null;

    const user = await this.prisma.user.upsert({
      where: { clerkUserId },
      update: { email, phone, role, name, identification: metadata?.identification ?? null },
      create: {
        clerkUserId,
        email,
        phone,
        role,
        name,
        identification: metadata?.identification ?? null,
      },
    });

    this.logger.debug(`Provisioned Prisma user for Clerk id ${clerkUserId}`);
    return user;
  }

  private validateRole(role?: string): Role {
    if (role && Object.values(Role).includes(role as Role)) {
      return role as Role;
    }
    return Role.CUSTOMER;
  }
}
