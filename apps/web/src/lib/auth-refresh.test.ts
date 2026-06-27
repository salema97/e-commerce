import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { refreshAuthSession } from '@/lib/auth-refresh';

describe('refreshAuthSession', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('dedupes concurrent refresh calls into a single fetch', async () => {
    const fetchMock = vi.fn().mockImplementation(
      () =>
        new Promise<Response>((resolve) => {
          setTimeout(() => {
            resolve(new Response(JSON.stringify({ ok: true }), { status: 200 }));
          }, 20);
        }),
    );
    vi.stubGlobal('fetch', fetchMock);

    const [first, second] = await Promise.all([refreshAuthSession(), refreshAuthSession()]);

    expect(fetchMock).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledWith('/api/auth/refresh', {
      method: 'POST',
      credentials: 'same-origin',
    });
    expect(first).toBe(true);
    expect(second).toBe(true);
  });
});
