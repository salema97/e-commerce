import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { WebhookController } from './webhook.controller.js';
import { WebhookService } from './webhook.service.js';

interface RawRequest extends Request {
  rawBody?: Buffer;
}

describe('WebhookController', () => {
  let controller: WebhookController;
  let service: { receiveEvolutionWebhook: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    service = {
      receiveEvolutionWebhook: vi.fn().mockResolvedValue(undefined),
    };

    const module = await Test.createTestingModule({
      controllers: [WebhookController],
      providers: [{ provide: WebhookService, useValue: service }],
    }).compile();

    controller = module.get(WebhookController);
  });

  it('delegates Evolution webhooks to WebhookService', async () => {
    const rawBody = Buffer.from(JSON.stringify({ event: 'messages.upsert', data: {} }));
    const req = { rawBody } as RawRequest;

    await controller.handle('messages.upsert', 'sig', req);

    expect(service.receiveEvolutionWebhook).toHaveBeenCalledWith(
      'messages.upsert',
      rawBody,
      'sig',
    );
  });
});
