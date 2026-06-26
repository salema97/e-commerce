import { ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { AppJwtService } from '../auth/jwt.service.js';
import { Role } from '../auth/role.enum.js';

export type OrderAccessContext = {
  userId?: string;
  role?: Role;
  guestEmail?: string;
};

const STAFF_ROLES: Role[] = [
  Role.SUPER_ADMIN,
  Role.ADMIN,
  Role.FINANCE,
  Role.SUPPORT,
  Role.INVENTORY,
];

@Injectable()
export class OrderAccessService {
  constructor(private readonly jwt: AppJwtService) {}

  buildContext(authorization?: string, guestEmail?: string): OrderAccessContext {
    if (typeof authorization === 'string' && authorization.startsWith('Bearer ')) {
      try {
        const payload = this.jwt.verifyAccessToken(authorization.slice(7));
        if (payload.type !== 'access') {
          throw new UnauthorizedException('Invalid token type');
        }
        return { userId: payload.sub, role: payload.role };
      } catch (error) {
        if (error instanceof UnauthorizedException) {
          throw error;
        }
        throw new UnauthorizedException('Invalid or expired token');
      }
    }

    const normalizedGuestEmail = guestEmail?.trim();
    if (normalizedGuestEmail) {
      return { guestEmail: normalizedGuestEmail };
    }

    throw new UnauthorizedException('Authentication required');
  }

  assertOrderAccess(
    order: { userId: string | null; customerEmail: string },
    context: OrderAccessContext,
  ): void {
    if (context.role && STAFF_ROLES.includes(context.role)) {
      return;
    }

    if (order.userId && context.userId) {
      if (order.userId === context.userId) {
        return;
      }
      throw new ForbiddenException('You do not have access to this order');
    }

    if (!order.userId && context.guestEmail) {
      if (
        order.customerEmail.toLowerCase() === context.guestEmail.toLowerCase()
      ) {
        return;
      }
      throw new ForbiddenException('You do not have access to this order');
    }

    if (order.userId && !context.userId) {
      throw new UnauthorizedException('Authentication required');
    }

    throw new ForbiddenException('You do not have access to this order');
  }
}
