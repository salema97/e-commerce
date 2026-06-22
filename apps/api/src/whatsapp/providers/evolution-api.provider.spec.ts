import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import { createHmac } from 'crypto';
import { EvolutionApiProvider } from './evolution-api.provider.js';
import { WhatsAppProviderError } from '../whatsapp-provider.error.js';

const EVOLUTION_API_URL = 'http://localhost:8080';
const EVOLUTION_API_KEY = 'apikey_xxx';
const EVOLUTION_WEBHOOK_SECRET = 'whsec_xxx';
const EVOLUTION_INSTANCE_NAME = 'ecommerce';

function createConfigServiceMock() {
  return {
    getOrThrow: (key: string) => {
      switch (key) {
        case 'EVOLUTION_API_URL':
          return EVOLUTION_API_URL;
        case 'EVOLUTION_API_KEY':
          return EVOLUTION_API_KEY;
        case 'EVOLUTION_WEBHOOK_SECRET':
          return EVOLUTION_WEBHOOK_SECRET;
        case 'EVOLUTION_INSTANCE_NAME':
          return EVOLUTION_INSTANCE_NAME;
        default:
          return '';
      }
    },
  };
}

function createFetchMock(response: Response): typeof fetch {
  return vi.fn().mockResolvedValue(response);
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

describe('EvolutionApiProvider', () => {
  let provider: EvolutionApiProvider;
  let fetchMock: ReturnType<typeof createFetchMock>;

  beforeEach(async () => {
    fetchMock = createFetchMock(jsonResponse({ key: { id: 'msg_123' }, status: 'PENDING' }));
    vi.stubGlobal('fetch', fetchMock);
    vi.useFakeTimers({ shouldAdvanceTime: true });

    const module = await Test.createTestingModule({
      providers: [
        EvolutionApiProvider,
        { provide: ConfigService, useValue: createConfigServiceMock() },
      ],
    }).compile();

    provider = module.get(EvolutionApiProvider);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.useRealTimers();
  });

  describe('sendText', () => {
    it('sends a text message to the Evolution API v2 endpoint', async () => {
      const result = await provider.sendText('+593991234567', 'Hello');

      expect(fetchMock).toHaveBeenCalledWith(
        `${EVOLUTION_API_URL}/message/sendText/${EVOLUTION_INSTANCE_NAME}`,
        expect.objectContaining({
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            apikey: EVOLUTION_API_KEY,
          },
          body: JSON.stringify({
            number: '+593991234567',
            text: 'Hello',
            options: { delay: 1_200 },
          }),
        }),
      );

      expect(result).toEqual({
        providerMessageId: 'msg_123',
        status: 'SENT',
      });
    });

    it('retries on 504 Gateway Timeout and succeeds on second attempt', async () => {
      fetchMock
        .mockResolvedValueOnce(jsonResponse({ error: 'timeout' }, 504))
        .mockResolvedValueOnce(jsonResponse({ key: { id: 'msg_retry' }, status: 'PENDING' }));

      const promise = provider.sendText('+593991234567', 'Retry');
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(fetchMock).toHaveBeenCalledTimes(2);
      expect(result.providerMessageId).toBe('msg_retry');
    });

    it('retries on network error and succeeds on third attempt', async () => {
      fetchMock
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockRejectedValueOnce(new TypeError('fetch failed'))
        .mockResolvedValueOnce(jsonResponse({ key: { id: 'msg_net' }, status: 'PENDING' }));

      const promise = provider.sendText('+593991234567', 'Network');
      await vi.runAllTimersAsync();
      const result = await promise;

      expect(fetchMock).toHaveBeenCalledTimes(3);
      expect(result.providerMessageId).toBe('msg_net');
    });

    it('does not retry on 4xx errors and throws a non-retryable error', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ error: 'Bad Request' }, 400));

      await expect(provider.sendText('+593991234567', 'Bad')).rejects.toMatchObject({
        retryable: false,
      });

      expect(fetchMock).toHaveBeenCalledTimes(1);
    });

    it('throws a retryable error after exhausting retries on 5xx', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ error: 'Server Error' }, 502));

      const promise = provider.sendText('+593991234567', 'Fail').catch((err) => err);
      await vi.runAllTimersAsync();
      const error = await promise;

      expect(error).toMatchObject({
        retryable: true,
        providerCode: '502',
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });

    it('throws a retryable error after exhausting network retries', async () => {
      fetchMock.mockRejectedValue(new TypeError('fetch failed'));

      const promise = provider.sendText('+593991234567', 'Network').catch((err) => err);
      await vi.runAllTimersAsync();
      const error = await promise;

      expect(error).toMatchObject({
        retryable: true,
        providerCode: 'NETWORK_ERROR',
      });
      expect(fetchMock).toHaveBeenCalledTimes(3);
    });
  });

  describe('sendTemplate', () => {
    it('sends a template message with variables', async () => {
      const result = await provider.sendTemplate('+593991234567', 'ORDER_CONFIRMED', {
        orderNumber: 'ORD-001',
        total: '$25.00',
      });

      expect(fetchMock).toHaveBeenCalledWith(
        `${EVOLUTION_API_URL}/message/sendTemplate/${EVOLUTION_INSTANCE_NAME}`,
        expect.objectContaining({
          method: 'POST',
          body: expect.stringContaining('order_confirmed'),
        }),
      );

      expect(result.providerMessageId).toBe('msg_123');
    });
  });

  describe('verifyWebhookSignature', () => {
    it('returns true for a valid HMAC-SHA256 signature', () => {
      const payload = Buffer.from('{"event":"message"}');
      const signature = createHmac('sha256', EVOLUTION_WEBHOOK_SECRET).update(payload).digest('hex');

      expect(provider.verifyWebhookSignature(payload, signature)).toBe(true);
    });

    it('returns false for a tampered payload', () => {
      const payload = Buffer.from('{"event":"message"}');
      const signature = createHmac('sha256', EVOLUTION_WEBHOOK_SECRET).update(payload).digest('hex');

      expect(provider.verifyWebhookSignature(Buffer.from('{"event":"tampered"}'), signature)).toBe(
        false,
      );
    });

    it('returns false for an invalid signature', () => {
      const payload = Buffer.from('{"event":"message"}');

      expect(provider.verifyWebhookSignature(payload, 'invalid')).toBe(false);
    });

    it('returns false for non-buffer/string payloads', () => {
      expect(provider.verifyWebhookSignature({ foo: 'bar' }, 'signature')).toBe(false);
    });
  });

  describe('error typing', () => {
    it('throws WhatsAppProviderError instances', async () => {
      fetchMock.mockResolvedValue(jsonResponse({ error: 'Bad Request' }, 400));

      await expect(provider.sendText('+593991234567', 'Bad')).rejects.toBeInstanceOf(
        WhatsAppProviderError,
      );
    });
  });
});
