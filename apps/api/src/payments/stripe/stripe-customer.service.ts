import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';
import { PrismaService } from '../../prisma/prisma.service.js';

@Injectable()
export class StripeCustomerService {
  private readonly logger = new Logger(StripeCustomerService.name);
  private readonly stripe: Stripe;

  constructor(
    configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {
    this.stripe = new Stripe(configService.getOrThrow<string>('STRIPE_SECRET_KEY'), {
      apiVersion: '2025-06-30.basil',
    });
  }

  async createOrUpdateCustomer(
    userId: string,
    email: string,
    name?: string,
  ): Promise<string | undefined> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (user?.stripeCustomerId) {
      try {
        await this.stripe.customers.update(user.stripeCustomerId, {
          email,
          name,
        });
        this.logger.debug(`Updated Stripe customer ${user.stripeCustomerId} for ${userId}`);
        return user.stripeCustomerId;
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        this.logger.warn({ error: message, userId }, 'Failed to update Stripe customer');
        return user.stripeCustomerId;
      }
    }

    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
        metadata: { userId },
      });

      await this.prisma.user.update({
        where: { id: userId },
        data: { stripeCustomerId: customer.id },
      });

      this.logger.log(`Created Stripe customer ${customer.id} for ${userId}`);
      return customer.id;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: message, userId }, 'Failed to create Stripe customer');
      return undefined;
    }
  }

  async findOrCreateEphemeralCustomer(email: string): Promise<string | undefined> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        metadata: { ephemeral: 'true' },
      });
      return customer.id;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error({ error: message, email }, 'Failed to create ephemeral Stripe customer');
      return undefined;
    }
  }
}
