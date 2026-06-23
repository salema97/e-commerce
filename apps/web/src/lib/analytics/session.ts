const SESSION_KEY = 'ecommerce-analytics-session';

export function getOrCreateSessionId(): string {
  if (typeof window === 'undefined') {
    return 'server';
  }
  let sessionId = sessionStorage.getItem(SESSION_KEY);
  if (!sessionId) {
    sessionId = crypto.randomUUID();
    sessionStorage.setItem(SESSION_KEY, sessionId);
  }
  return sessionId;
}
