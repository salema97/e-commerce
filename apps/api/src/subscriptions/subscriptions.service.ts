import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { SubscriptionStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service.js';
import { StripeCustomerService } from '../payments/stripe/stripe-customer.service.js';
import { StripeBillingService } from './stripe-billing.service.js';
import {
  CreateSubscriptionPlanDto,
  UpdateSubscriptionPlanDto,
} from './dto/subscriptions.dto.js';

@Injectable()
export class SubscriptionsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly stripeCustomerService: StripeCustomerService,
    private readonly stripeBilling: StripeBillingService,
  ) {}

  listPlans(activeOnly = true) {
    return this.prisma.subscriptionPlan.findMany({
      where: activeOnly ? { isActive: true } : undefined,
      include: { product: { select: { id: true, name: true, slug: true, price: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async createPlan(dto: CreateSubscriptionPlanDto) {
    const product = await this.prisma.product.findUnique({ where: { id: dto.productId } });
    if (!product) throw new NotFoundException(`Product ${dto.productId} not found`);

    return this.prisma.$transaction(async (tx) => {
      await tx.product.update({
        where: { id: dto.productId },
        data: { isSubscription: true },
      });
      return tx.subscriptionPlan.create({
        data: {
          productId: dto.productId,
          stripeProductId: dto.stripeProductId,
          stripePriceId: dto.stripePriceId,
          interval: dto.interval,
          intervalCount: dto.intervalCount,
          trialDays: dto.trialDays,
          isActive: dto.isActive,
        },
      });
    });
  }

  updatePlan(id: string, dto: UpdateSubscriptionPlanDto) {
    return this.prisma.subscriptionPlan.update({ where: { id }, data: dto });
  }

  listMySubscriptions(userId: string) {
    return this.prisma.customerSubscription.findMany({
      where: { userId },
      include: { plan: { include: { product: true } } },
      orderBy: { createdAt: 'desc' },
    });
  }

  async subscribe(userId: string, planId: string) {
    const plan = await this.prisma.subscriptionPlan.findUnique({
      where: { id: planId },
      include: { product: true },
    });
    if (!plan?.isActive) throw new NotFoundException('Subscription plan not found');
    if (!plan.stripePriceId) {
      throw new BadRequestException('Plan is missing stripePriceId configuration');
    }
    if (!this.stripeBilling.isConfigured()) {
      throw new BadRequestException('Stripe Billing is not configured');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) throw new NotFoundException('User not found');

    const customerId = await this.stripeCustomerService.createOrUpdateCustomer(
      user.clerkUserId,
      user.email,
      user.name ?? undefined,
    );
    if (!customerId) {
      throw new BadRequestException('Unable to create Stripe customer');
    }

    return this.stripeBilling.createSubscriptionCheckout({
      stripePriceId: plan.stripePriceId,
      customerId,
      customerEmail: user.email,
      userId,
      planId,
    });
  }

  async billingPortal(userId: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user?.stripeCustomerId) {
      throw new BadRequestException('No Stripe customer linked to this account');
    }
    return this.stripeBilling.createBillingPortalSession(user.stripeCustomerId);
  }

  async upsertFromStripe(params: {
    userId: string;
    planId: string;
    stripeSubscriptionId: string;
    status: SubscriptionStatus;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
    cancelAtPeriodEnd?: boolean;
  }) {
    const existing = await this.prisma.customerSubscription.findFirst({
      where: { stripeSubscriptionId: params.stripeSubscriptionId },
    });
    if (existing) {
      return this.prisma.customerSubscription.update({
        where: { id: existing.id },
        data: {
          status: params.status,
          currentPeriodStart: params.currentPeriodStart,
          currentPeriodEnd: params.currentPeriodEnd,
          cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
          cancelledAt: params.status === SubscriptionStatus.CANCELLED ? new Date() : null,
        },
      });
    }
    return this.prisma.customerSubscription.create({
      data: {
        userId: params.userId,
        planId: params.planId,
        stripeSubscriptionId: params.stripeSubscriptionId,
        status: params.status,
        currentPeriodStart: params.currentPeriodStart,
        currentPeriodEnd: params.currentPeriodEnd,
        cancelAtPeriodEnd: params.cancelAtPeriodEnd ?? false,
      },
    });
  }
}
