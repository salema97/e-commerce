import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash, randomBytes } from 'node:crypto';
import { PrismaService } from '../prisma/prisma.service.js';
import { Role } from './role.enum.js';
import { PasswordService } from './password.service.js';
import { AppJwtService } from './jwt.service.js';
import type { LoginDto } from './dto/login.dto.js';
import type { RegisterDto } from './dto/register.dto.js';
import { StripeCustomerService } from '../payments/stripe/stripe-customer.service.js';

export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

export interface AuthUserResponse {
  id: string;
  email: string;
  name: string | null;
  role: Role;
  phone: string | null;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly passwords: PasswordService,
    private readonly jwt: AppJwtService,
    private readonly config: ConfigService,
    private readonly stripeCustomerService: StripeCustomerService,
  ) {}

  async register(
    dto: RegisterDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<{ user: AuthUserResponse; tokens: AuthTokens }> {
    const existing = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (existing) {
      throw new ConflictException('Email already registered');
    }

    const passwordHash = await this.passwords.hash(dto.password);
    const user = await this.prisma.user.create({
      data: {
        email: dto.email,
        passwordHash,
        name: dto.name,
        phone: dto.phone,
        role: Role.CUSTOMER,
      },
    });

    this.stripeCustomerService
      .createOrUpdateCustomer(user.id, user.email, user.name ?? undefined)
      .catch(() => undefined);

    const tokens = await this.issueTokens(user.id, user.role as Role, meta);
    return { user: this.toAuthUser(this.pickAuthFields(user)), tokens };
  }

  async login(
    dto: LoginDto,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<{ user: AuthUserResponse; tokens: AuthTokens }> {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });
    if (!user?.passwordHash) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await this.passwords.verify(user.passwordHash, dto.password);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const tokens = await this.issueTokens(user.id, user.role as Role, meta);
    return { user: this.toAuthUser(this.pickAuthFields(user)), tokens };
  }

  async refresh(
    refreshToken: string,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthTokens> {
    const tokenHash = this.hashToken(refreshToken);
    const session = await this.prisma.authSession.findUnique({
      where: { tokenHash },
      include: { user: true },
    });

    if (!session || session.revokedAt || session.expiresAt < new Date()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    await this.prisma.authSession.update({
      where: { id: session.id },
      data: { revokedAt: new Date() },
    });

    return this.issueTokens(session.user.id, session.user.role as Role, meta);
  }

  async logout(refreshToken: string): Promise<void> {
    const tokenHash = this.hashToken(refreshToken);
    await this.prisma.authSession.updateMany({
      where: { tokenHash, revokedAt: null },
      data: { revokedAt: new Date() },
    });
  }

  async getProfile(userId: string): Promise<AuthUserResponse> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException('User not found');
    }
    return this.toAuthUser(this.pickAuthFields(user));
  }

  private pickAuthFields(user: {
    id: string;
    email: string;
    name: string | null;
    role: { toString(): string };
    phone: string | null;
  }) {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: String(user.role),
      phone: user.phone,
    };
  }

  private async issueTokens(
    userId: string,
    role: Role,
    meta?: { userAgent?: string; ipAddress?: string },
  ): Promise<AuthTokens> {
    const accessToken = this.jwt.signAccessToken(userId, role);
    const refreshToken = randomBytes(48).toString('base64url');
    const refreshDays = Number(this.config.get('AUTH_REFRESH_TOKEN_DAYS', '30'));
    const expiresAt = new Date(Date.now() + refreshDays * 24 * 60 * 60 * 1000);

    await this.prisma.authSession.create({
      data: {
        userId,
        tokenHash: this.hashToken(refreshToken),
        expiresAt,
        userAgent: meta?.userAgent,
        ipAddress: meta?.ipAddress,
      },
    });

    return {
      accessToken,
      refreshToken,
      expiresIn: 15 * 60,
    };
  }

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private toAuthUser(user: {
    id: string;
    email: string;
    name: string | null;
    role: string;
    phone: string | null;
  }): AuthUserResponse {
    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role as Role,
      phone: user.phone,
    };
  }
}
