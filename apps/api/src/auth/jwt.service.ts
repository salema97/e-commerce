import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import type { Role } from './role.enum.js';

export interface AccessTokenPayload {
  sub: string;
  role: Role;
  type: 'access';
}

@Injectable()
export class AppJwtService {
  constructor(
    private readonly jwt: NestJwtService,
    private readonly config: ConfigService,
  ) {}

  signAccessToken(userId: string, role: Role): string {
    const payload: AccessTokenPayload = { sub: userId, role, type: 'access' };
    return this.jwt.sign(payload, {
      secret: this.config.getOrThrow('AUTH_JWT_ACCESS_SECRET'),
      expiresIn: this.config.get('AUTH_ACCESS_TOKEN_TTL', '15m'),
    });
  }

  verifyAccessToken(token: string): AccessTokenPayload {
    return this.jwt.verify<AccessTokenPayload>(token, {
      secret: this.config.getOrThrow('AUTH_JWT_ACCESS_SECRET'),
    });
  }
}
