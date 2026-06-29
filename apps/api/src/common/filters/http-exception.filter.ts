import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Inject,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';
import { ErrorTracker } from '../../analytics/error-tracker.interface.js';
import { EventBus } from '../../event-bus/event-bus.interface.js';

export interface ErrorResponse {
  statusCode: number;
  message: string | object;
  error: string;
  timestamp: string;
  path: string;
}

const SPIKE_WINDOW_MS = 60_000;
const SPIKE_THRESHOLD = 10;

interface ErrorBucket {
  count: number;
  windowStart: number;
}

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private static readonly fiveXxBucket: ErrorBucket = { count: 0, windowStart: 0 };

  constructor(
    private readonly httpAdapterHost: HttpAdapterHost,
    private readonly errorTracker?: ErrorTracker,
    @Inject(EventBus) private readonly eventBus?: EventBus,
  ) {}

  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();
    const response = ctx.getResponse();

    const statusCode =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    const message =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal server error';

    const errorResponse: ErrorResponse = {
      statusCode,
      message,
      error: HttpStatus[statusCode] ?? 'Internal Server Error',
      timestamp: new Date().toISOString(),
      path: httpAdapter.getRequestUrl(request) as string,
    };

    if (statusCode >= 500 && this.errorTracker) {
      this.errorTracker.captureException(exception, {
        tags: { path: errorResponse.path },
        extra: { statusCode },
      });
      this.checkAndEmitSpikeAlert(statusCode);
    }

    httpAdapter.reply(response, errorResponse, statusCode);
  }

  private checkAndEmitSpikeAlert(statusCode: number): void {
    if (!this.eventBus) return;

    const now = Date.now();
    const bucket = AllExceptionsFilter.fiveXxBucket;

    if (bucket.windowStart === 0 || now - bucket.windowStart > SPIKE_WINDOW_MS) {
      bucket.count = 0;
      bucket.windowStart = now;
    }

    bucket.count += 1;

    if (bucket.count === SPIKE_THRESHOLD) {
      const alertMessage = `5xx spike detected: ${SPIKE_THRESHOLD} errors in ${SPIKE_WINDOW_MS / 1000}s`;
      this.errorTracker?.captureMessage(alertMessage, {
        level: 'warning',
        tags: { alertType: '5xx_spike', statusCode: String(statusCode) },
      });
      void this.eventBus.publish({
        name: 'alert.5xx_spike',
        payload: {
          threshold: SPIKE_THRESHOLD,
          windowSeconds: SPIKE_WINDOW_MS / 1000,
          statusCode,
        },
      });
    }
  }
}
