export function formatApiError(body: unknown, fallback: string): string {
  if (!body || typeof body !== 'object') return fallback;

  const record = body as Record<string, unknown>;
  const message = record.message;

  if (typeof message === 'string') return message;
  if (Array.isArray(message)) return message.map(String).join(', ');
  if (message && typeof message === 'object') {
    const nested = message as Record<string, unknown>;
    if (typeof nested.message === 'string') return nested.message;
    if (Array.isArray(nested.message)) return nested.message.map(String).join(', ');
  }

  return fallback;
}
