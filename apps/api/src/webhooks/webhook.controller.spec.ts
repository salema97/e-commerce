import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { UnauthorizedException } from '@nestjs/common';
import { WebhookController } from './webhook.controller.js';
import { WebhookService } from './webhook.service.js';
import { WhatsAppProvider } from '../whatsapp/whatsapp-provider.interface.js';
import { RedisIdempotencyService } from '../common/redis/idempotency.service.js';

interface RawRequest extends Request {
  rawBody?: Buffer;
}

describe('WebhookController', () => {
  let controller: WebhookController;
  let provider: ReturnType<typeof mockProvider>;
  let idempotency: ReturnType<typeof mockIdempotency>;
  let service: ReturnType<typeof mockService>;

  function mockProvider() {
    return {
      verifyWebhookSignature: vi.fn(),
    };
  }

  function mockIdempotency() {
    return {
      claim: vi.fn(),
    };
  }

  function mockService() {
    return {
      handleEvent: vi.fn(),
    };
  }

  function makeRequest(body: object): RawRequest {
    return { rawBody: Buffer.from(JSON.stringify(body)) } as RawRequest;
  }

  beforeEach(async () => {
    provider = mockProvider();
    idempotency = mockIdempotency();
    service = mockService();

    const module = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [
        { provide: WhatsAppProvider, useValue: provider },
        { provide: RedisIdempotencyService, useValue: idempotency },
        { provide: WebhookService, useValue: service },
      ],
    }).compile();

    controller = module.get(WebhookController);
  });

  it('rejects requests with missing signature', async () => {
    const req = makeRequest({});
    await expect(controller.handle('messages.upsert', undefined, req)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('rejects requests with invalid signature', async () => {
    provider.verifyWebhookSignature.mockReturnValue(false);
    const req = makeRequest({ event: 'messages.upsert' });
    await expect(controller.handle('messages.upsert', 'bad-sig', req)).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('returns early on duplicate payloads', async () => {
    provider.verifyWebhookSignature.mockReturnValue(true);
    idempotency.claim.mockResolvedValue(false);
    const req = makeRequest({ event: 'messages.upsert' });

    await controller.handle('messages.upsert', 'sig', req);

    expect(service.handleEvent).not.toHaveBeenCalled();
  });

  it('processes valid events', async () => {
    provider.verifyWebhookSignature.mockReturnValue(true);
    idempotency.claim.mockResolvedValue(true);
    const payload = { event: 'messages.upsert', data: { key: { id: 'm1' } } };
    const req = makeRequest(payload);

    await controller.handle('messages.upsert', 'sig', req);

    expect(service.handleEvent).toHaveBeenCalledWith('messages.upsert', payload);
  });
});
