import * as Sentry from '@sentry/react-native';

const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;

let initialized = false;

export function initMobileSentry(): void {
  if (initialized || !dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.EXPO_PUBLIC_APP_ENV ?? 'development',
    release: process.env.EXPO_PUBLIC_SENTRY_RELEASE,
    tracesSampleRate: Number(process.env.EXPO_PUBLIC_SENTRY_TRACES_SAMPLE_RATE ?? '0.1'),
    enableAutoSessionTracking: true,
  });

  initialized = true;
}

export function captureMobileException(error: unknown, context?: Record<string, unknown>): void {
  if (!initialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureException(error);
  });
}

export function captureMobileMessage(message: string, context?: Record<string, unknown>): void {
  if (!initialized) {
    return;
  }

  Sentry.withScope((scope) => {
    if (context) {
      scope.setExtras(context);
    }
    Sentry.captureMessage(message);
  });
}

export { Sentry };
