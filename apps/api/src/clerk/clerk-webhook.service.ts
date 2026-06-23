import {
  Injectable,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from '../auth/role.enum.js';
import { StripeCustomerService } from '../payments/stripe/stripe-customer.service.js';

interface ClerkEmail {
  id: string;
  email_address: string;
}

interface ClerkPhone {
  id: string;
  phone_number: string;
}

interface ClerkWebhookData {
  id: string;
  email_addresses?: ClerkEmail[];
  primary_email_address_id?: string;
  phone_numbers?: ClerkPhone[];
  primary_phone_number_id?: string;
  first_name?: string;
  last_name?: string;
  public_metadata?: {
    role?: string;
    identification?: string;
  };
}

interface ClerkWebhookPayload {
  type: string;
  data: ClerkWebhookData;
}

@Injectable()
export class ClerkWebhookService {
  private readonly logger = new Logger(ClerkWebhookService.name);

  constructor(
    private prisma: PrismaService,
    private readonly stripeCustomerService: StripeCustomerService,
  ) {}

  async handleUserWebhook(payload: ClerkWebhookPayload): Promise<void> {
    if (payload.type !== 'user.created' && payload.type !== 'user.updated') {
      return;
    }

    const { data } = payload;
    const clerkUserId = data.id;
    const primaryEmail = data.email_addresses?.find(
      (e) => e.id === data.primary_email_address_id,
    );
    const email =
      primaryEmail?.email_address ?? data.email_addresses?.[0]?.email_address;
    const primaryPhone = data.phone_numbers?.find(
      (p) => p.id === data.primary_phone_number_id,
    );
    const phone =
      primaryPhone?.phone_number ?? data.phone_numbers?.[0]?.phone_number;
    const role = this.validateRole(data.public_metadata?.role);

    if (!email) {
      throw new BadRequestException('User payload missing email');
    }

    const name = this.buildName(data.first_name, data.last_name);
    const identification = data.public_metadata?.identification;

    await this.prisma.user.upsert({
      where: { clerkUserId },
      update: { email, phone, role, name, identification },
      create: { clerkUserId, email, phone, role, name, identification },
    });

    this.logger.debug(`Synced Clerk user ${clerkUserId} with role ${role}`);

    this.stripeCustomerService
      .createOrUpdateCustomer(clerkUserId, email, name)
      .catch((error: unknown) => {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.error(
          { error: message, clerkUserId },
          'Async Stripe customer sync failed after Clerk webhook',
        );
      });
  }

  private buildName(firstName?: string, lastName?: string): string | undefined {
    const name = [firstName, lastName].filter(Boolean).join(' ').trim();
    return name || undefined;
  }

  private validateRole(role?: string): Role {
    const validRoles = Object.values(Role);
    if (!role || !validRoles.includes(role as Role)) {
      throw new BadRequestException(`Invalid role: ${role}`);
    }
    return role as Role;
  }
}
