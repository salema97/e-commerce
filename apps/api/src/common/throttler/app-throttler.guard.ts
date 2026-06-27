import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import type { Request } from 'express';

type AuthenticatedRequest = Request & {
  user?: { userId: string };
};

@Injectable()
export class AppThrottlerGuard extends ThrottlerGuard {
  protected async shouldSkip(_context: ExecutionContext): Promise<boolean> {
    return process.env.E2E_RELAX_THROTTLE === 'true';
  }

  protected async getTracker(req: AuthenticatedRequest): Promise<string> {
    const userId = req.user?.userId;
    if (userId) {
      return `user:${userId}`;
    }

    const apiKey = req.headers['x-api-key'];
    if (typeof apiKey === 'string' && apiKey.length > 0) {
      return `apikey:${apiKey}`;
    }

    return req.ip ?? 'unknown';
  }
}
