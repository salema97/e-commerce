import { ExecutionContext, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Reflector } from '@nestjs/core';
import {
  InjectThrottlerOptions,
  InjectThrottlerStorage,
  ThrottlerGuard,
  type ThrottlerModuleOptions,
  type ThrottlerStorage,
} from '@nestjs/throttler';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: { userId: string };
};

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  constructor(
    @InjectThrottlerOptions() options: ThrottlerModuleOptions,
    @InjectThrottlerStorage() storageService: ThrottlerStorage,
    reflector: Reflector,
    private readonly configService: ConfigService,
  ) {
    super(options, storageService, reflector);
  }

  protected shouldSkip(_context: ExecutionContext): Promise<boolean> {
    return Promise.resolve(this.configService.get<string>('E2E_RELAX_THROTTLE') === 'true');
  }

  protected getTracker(req: AuthenticatedRequest): Promise<string> {
    const userId = req.user?.userId;
    if (userId) {
      return Promise.resolve(`user:${userId}`);
    }

    const apiKey = req.headers['x-api-key'];
    if (typeof apiKey === 'string' && apiKey.length > 0) {
      return Promise.resolve(`apikey:${apiKey}`);
    }

    return Promise.resolve(req.ip ?? 'unknown');
  }
}
