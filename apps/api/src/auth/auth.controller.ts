import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import type { Request } from 'express';
import { Public } from './public.decorator.js';
import { CurrentUser } from './current-user.decorator.js';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';
import { RegisterDto } from './dto/register.dto.js';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @Throttle({ default: { limit: 5, ttl: 60_000 } })
  @ApiOperation({ summary: 'Register a new customer account' })
  @ApiResponse({ status: 201, description: 'Account created' })
  register(@Body() dto: RegisterDto, @Req() req: Request) {
    return this.authService.register(dto, this.requestMeta(req));
  }

  @Public()
  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60_000 } })
  @HttpCode(200)
  @ApiOperation({ summary: 'Login with email and password' })
  login(@Body() dto: LoginDto, @Req() req: Request) {
    return this.authService.login(dto, this.requestMeta(req));
  }

  @Public()
  @Post('refresh')
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @HttpCode(200)
  @ApiOperation({ summary: 'Rotate refresh token and issue new access token' })
  refresh(@Body() body: { refreshToken?: string }, @Req() req: Request) {
    const refreshToken = body.refreshToken ?? this.readRefreshCookie(req);
    if (!refreshToken) {
      throw new UnauthorizedException('Missing refresh token');
    }
    return this.authService.refresh(refreshToken, this.requestMeta(req));
  }

  @Post('logout')
  @HttpCode(200)
  @ApiOperation({ summary: 'Revoke refresh token session' })
  logout(@Body() body: { refreshToken?: string }, @Req() req: Request) {
    const refreshToken = body.refreshToken ?? this.readRefreshCookie(req);
    if (refreshToken) {
      return this.authService.logout(refreshToken);
    }
    return { ok: true };
  }

  @Get('me')
  @ApiOperation({ summary: 'Get current authenticated user profile' })
  me(@CurrentUser('userId') userId: string) {
    return this.authService.getProfile(userId);
  }

  private requestMeta(req: Request) {
    return {
      userAgent: req.headers['user-agent'],
      ipAddress: req.ip,
    };
  }

  private readRefreshCookie(req: Request): string | undefined {
    const cookieHeader = req.headers.cookie;
    if (!cookieHeader) return undefined;
    const match = cookieHeader.match(/(?:^|;\s*)refresh_token=([^;]+)/);
    return match?.[1] ? decodeURIComponent(match[1]) : undefined;
  }
}
