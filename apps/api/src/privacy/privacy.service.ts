import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';
import { UserProvisioningService } from '../users/user-provisioning.service.js';

@Injectable()
export class PrivacyService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly provisioning: UserProvisioningService,
  ) {}

  async exportUserData(clerkUserId: string) {
    const user = await this.provisioning.ensureByClerkUserId(clerkUserId);

    const [addresses, orders, returns, loyalty, referralCode, quotes] = await Promise.all([
      this.prisma.address.findMany({ where: { userId: user.id } }),
      this.prisma.order.findMany({
        where: { userId: user.id },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
      this.prisma.returnRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
      this.prisma.loyaltyAccount.findUnique({
        where: { userId: user.id },
        include: { transactions: { take: 50, orderBy: { createdAt: 'desc' } } },
      }),
      this.prisma.referralCode.findUnique({ where: { userId: user.id } }),
      this.prisma.quote.findMany({
        where: { requestedByUserId: user.id },
        include: { items: true },
        orderBy: { createdAt: 'desc' },
        take: 50,
      }),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        phone: user.phone,
        role: user.role,
        createdAt: user.createdAt.toISOString(),
      },
      addresses,
      orders,
      returns,
      loyalty,
      referrals: referralCode,
      quotes,
      notificationPreferences: {
        whatsappOptOut: user.whatsappOptOut,
        emailOptOut: user.emailOptOut,
        marketingEmailOptOut: user.marketingEmailOptOut,
        ccpaDoNotSell: user.ccpaDoNotSell,
      },
    };
  }

  async deleteUserData(clerkUserId: string) {
    const user = await this.provisioning.ensureByClerkUserId(clerkUserId);
    const anonymizedEmail = `deleted+${user.id}@anon.local`;

    await this.prisma.$transaction(async (tx) => {
      await tx.cart.deleteMany({ where: { userId: user.id } });
      await tx.wishlist.deleteMany({ where: { userId: user.id } });
      await tx.address.deleteMany({ where: { userId: user.id } });
      await tx.pushDeviceToken.deleteMany({ where: { userId: user.id } });
      await tx.companyUser.deleteMany({ where: { userId: user.id } });

      await tx.order.updateMany({
        where: { userId: user.id },
        data: {
          customerName: 'Usuario eliminado',
          customerEmail: anonymizedEmail,
          customerPhone: null,
          customerIdentification: null,
        },
      });

      await tx.user.update({
        where: { id: user.id },
        data: {
          email: anonymizedEmail,
          name: null,
          phone: null,
          identification: null,
          whatsappOptOut: true,
          emailOptOut: true,
          marketingEmailOptOut: true,
          ccpaDoNotSell: true,
          stripeCustomerId: null,
        },
      });
    });

    return {
      userId: user.id,
      anonymized: true,
      deletedAt: new Date().toISOString(),
      message:
        'Datos personales anonimizados. Las órdenes se conservan por obligaciones fiscales. Elimina la cuenta en Clerk desde su panel de usuario.',
    };
  }

  async setCcpaOptOut(clerkUserId: string, optOut: boolean) {
    const user = await this.provisioning.ensureByClerkUserId(clerkUserId);
    const updated = await this.prisma.user.update({
      where: { id: user.id },
      data: { ccpaDoNotSell: optOut },
    });

    return {
      userId: updated.id,
      ccpaDoNotSell: updated.ccpaDoNotSell,
      updatedAt: updated.updatedAt.toISOString(),
    };
  }
}
