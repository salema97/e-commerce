import { describe, it, expect, beforeEach, vi } from 'vitest';
import { BadRequestException } from '@nestjs/common';
import { MessageController } from './message.controller.js';
import { MessageService } from './message.service.js';

describe('MessageController', () => {
  let controller: MessageController;
  let service: ReturnType<typeof mockService>;

  function mockService() {
    return {
      findAllByConversation: vi.fn(),
      createOutbound: vi.fn(),
    };
  }

  beforeEach(() => {
    service = mockService();
    controller = new MessageController(service as unknown as MessageService);
  });

  it('lists messages for a conversation with pagination', async () => {
    service.findAllByConversation.mockResolvedValue({
      data: [],
      meta: { page: 2, limit: 10, total: 0, totalPages: 0 },
    });

    const result = await controller.findAll('c1', { page: 2, limit: 10 });

    expect(service.findAllByConversation).toHaveBeenCalledWith('c1', { page: 2, limit: 10 });
    expect(result.meta).toEqual({ page: 2, limit: 10, total: 0, totalPages: 0 });
  });

  it('creates an outbound message', async () => {
    service.createOutbound.mockResolvedValue({ id: 'm1', content: 'Hello' });

    const result = await controller.create('c1', { content: 'Hello' });

    expect(service.createOutbound).toHaveBeenCalledWith('c1', { content: 'Hello' });
    expect(result.id).toBe('m1');
  });

  it('rejects empty message content', async () => {
    await expect(controller.create('c1', { content: '' })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('rejects message content over 4096 characters', async () => {
    await expect(controller.create('c1', { content: 'a'.repeat(4097) })).rejects.toBeInstanceOf(
      BadRequestException,
    );
  });

  it('passes empty pagination defaults to the service', async () => {
    service.findAllByConversation.mockResolvedValue({
      data: [],
      meta: { page: 1, limit: 20, total: 0, totalPages: 0 },
    });

    await controller.findAll('c1', {});

    expect(service.findAllByConversation).toHaveBeenCalledWith('c1', {});
  });
});
