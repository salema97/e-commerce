import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ErrorReportContext, ErrorTracker } from './error-tracker.interface.js';

@Injectable()
export class ConsoleErrorTracker extends ErrorTracker {
  private readonly logger = new Logger(ConsoleErrorTracker.name);

  captureException(error: unknown, context?: ErrorReportContext): void {
    this.logger.error({ error, ...context }, 'Captured exception');
  }

  captureMessage(message: string, context?: ErrorReportContext): void {
    this.logger.warn({ message, ...context }, 'Captured message');
  }
}

@Injectable()
export class SentryErrorTracker extends ErrorTracker {
  private readonly logger = new Logger(SentryErrorTracker.name);
  private initialized = false;

  constructor(private readonly config: ConfigService) {
    super();
    void this.initSentry();
  }

  private async initSentry(): Promise<void> {
    const dsn = this.config.get<string>('SENTRY_DSN');
    if (!dsn) {
      return;
    }
    try {
      const Sentry = await import('@sentry/node');
      Sentry.init({
        dsn,
        environment: this.config.get<string>('NODE_ENV', 'development'),
        release: this.config.get<string>('SENTRY_RELEASE'),
        tracesSampleRate: Number(this.config.get('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
      });
      this.initialized = true;
    } catch (error) {
      this.logger.warn({ error }, 'Sentry SDK unavailable');
    }
  }

  captureException(error: unknown, context?: ErrorReportContext): void {
    if (!this.initialized) {
      return;
    }
    void import('@sentry/node').then((Sentry) => {
      Sentry.withScope((scope) => {
        if (context?.userId) {
          scope.setUser({ id: context.userId });
        }
        if (context?.tags) {
          for (const [key, value] of Object.entries(context.tags)) {
            scope.setTag(key, value);
          }
        }
        if (context?.extra) {
          scope.setExtras(context.extra);
        }
        Sentry.captureException(error);
      });
    });
  }

  captureMessage(message: string, context?: ErrorReportContext): void {
    if (!this.initialized) {
      return;
    }
    void import('@sentry/node').then((Sentry) => {
      Sentry.captureMessage(message, context?.level ?? 'error');
    });
  }
}
