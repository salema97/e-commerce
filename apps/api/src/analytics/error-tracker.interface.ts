export interface ErrorReportContext {
  level?: 'error' | 'warning' | 'info';
  tags?: Record<string, string>;
  extra?: Record<string, unknown>;
  userId?: string;
}

export abstract class ErrorTracker {
  abstract captureException(error: unknown, context?: ErrorReportContext): void;
  abstract captureMessage(message: string, context?: ErrorReportContext): void;
}
