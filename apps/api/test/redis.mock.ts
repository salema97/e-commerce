import { vi } from 'vitest';

type RedisEntry = { value: string; expiresAt?: number };

export function createInMemoryRedisClient() {
  const store = new Map<string, RedisEntry>();

  const isExpired = (entry: RedisEntry) =>
    entry.expiresAt !== undefined && Date.now() > entry.expiresAt;

  return {
    status: 'ready' as const,
    on: vi.fn(),
    ping: vi.fn(async () => 'PONG'),
    get: vi.fn(async (key: string) => {
      const entry = store.get(key);
      if (!entry || isExpired(entry)) {
        store.delete(key);
        return null;
      }
      return entry.value;
    }),
    set: vi.fn(async (key: string, value: string, ...args: unknown[]) => {
      let expiresAt: number | undefined;
      const pxIndex = args.indexOf('PX');
      if (pxIndex >= 0) {
        expiresAt = Date.now() + Number(args[pxIndex + 1]);
      }
      const exIndex = args.indexOf('EX');
      if (exIndex >= 0) {
        expiresAt = Date.now() + Number(args[exIndex + 1]) * 1000;
      }
      store.set(key, { value, expiresAt });
      return 'OK';
    }),
    incr: vi.fn(async (key: string) => {
      const entry = store.get(key);
      const current = entry && !isExpired(entry) ? Number.parseInt(entry.value, 10) : 0;
      const next = current + 1;
      store.set(key, { value: String(next), expiresAt: entry?.expiresAt });
      return next;
    }),
    pexpire: vi.fn(async (key: string, ms: number) => {
      const entry = store.get(key);
      if (!entry) return 0;
      entry.expiresAt = Date.now() + ms;
      return 1;
    }),
    pttl: vi.fn(async (key: string) => {
      const entry = store.get(key);
      if (!entry) return -2;
      if (entry.expiresAt === undefined) return -1;
      return Math.max(entry.expiresAt - Date.now(), 0);
    }),
    del: vi.fn(async (...keys: string[]) => {
      let removed = 0;
      for (const key of keys) {
        if (store.delete(key)) removed += 1;
      }
      return removed;
    }),
    scanStream: vi.fn(() => {
      const keys = [...store.keys()];
      return {
        on(event: string, handler: (batch?: string[]) => void) {
          if (event === 'data') handler(keys);
          if (event === 'end') handler();
        },
      };
    }),
    quit: vi.fn(async () => 'OK'),
  };
}

export function createTestRedisServiceMock() {
  return {
    client: createInMemoryRedisClient(),
    onModuleDestroy: vi.fn(),
  };
}
