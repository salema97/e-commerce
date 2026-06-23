import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ConfigService } from '@nestjs/config';
import { verifyToken } from '@clerk/backend';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { Role } from './role.enum.js';
import { PrismaService } from '../prisma/prisma.service.js';
import { getTestAuthSession, isTestAuthEnabled } from './test-auth.js';

export interface AuthenticatedRequest {
  headers: Record<string, string | string[] | undefined>;
  user: { userId: string; role: Role };
  rawBody?: Buffer;
  params?: Record<string, string>;
  path?: string;
  url?: string;
  method?: string;
}

@Injectable()
export class ClerkJwtGuard implements CanActivate {
  private readonly logger = new Logger(ClerkJwtGuard.name);

  constructor(
    private reflector: Reflector,
    private configService: ConfigService,
    private prisma: PrismaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (isPublic) return true;

    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (isTestAuthEnabled() && process.env.NODE_ENV !== 'production') {
      const headers = new Headers(
        Object.entries(request.headers).reduce(
          (acc, [key, value]) => {
            if (typeof value === 'string') acc[key] = value;
            return acc;
          },
          {} as Record<string, string>,
        ),
      );
      const testSession = getTestAuthSession(headers);
      if (testSession) {
        request.user = { userId: testSession.userId, role: testSession.role as Role };
        return true;
      }
    }

    const authHeader = request.headers.authorization;
    if (typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
      throw new UnauthorizedException('Missing or invalid authorization header');
    }

    try {
      const payload = await verifyToken(authHeader.slice(7), {
        secretKey: this.configService.getOrThrow('CLERK_SECRET_KEY'),
      });
      const jwtRole =
        ((payload.public_metadata as Record<string, unknown>)?.role as Role) ??
        Role.CUSTOMER;

      await this.reconcileRoleIfNeeded(payload.sub as string, jwtRole);

      request.user = { userId: payload.sub as string, role: jwtRole };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid Clerk token');
    }
  }

  private async reconcileRoleIfNeeded(
    clerkUserId: string,
    jwtRole: Role,
  ): Promise<void> {
    try {
      const dbUser = await this.prisma.user.findUnique({
        where: { clerkUserId },
      });

      if (dbUser && dbUser.role !== jwtRole) {
        await this.prisma.user.update({
          where: { clerkUserId },
          data: { role: jwtRole },
        });
        this.logger.debug(
          { clerkUserId, oldRole: dbUser.role, newRole: jwtRole },
          'Reconciled stale DB role from Clerk JWT',
        );
      }
    } catch (error) {
      this.logger.warn(
        { error, clerkUserId },
        'Failed to reconcile DB role; continuing with JWT role',
      );
    }
  }
}
