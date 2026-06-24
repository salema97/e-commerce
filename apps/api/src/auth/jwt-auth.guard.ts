import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { IS_PUBLIC_KEY } from './public.decorator.js';
import { Role } from './role.enum.js';
import { AppJwtService } from './jwt.service.js';
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
export class JwtAuthGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private jwt: AppJwtService,
  ) {}

  canActivate(context: ExecutionContext): boolean {
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
      const payload = this.jwt.verifyAccessToken(authHeader.slice(7));
      if (payload.type !== 'access') {
        throw new UnauthorizedException('Invalid token type');
      }
      request.user = { userId: payload.sub, role: payload.role };
      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
