import { describe, it, expect, beforeEach, vi } from 'vitest';
import { MessageController } from './message.controller.js';
import { MessageService } from './message.service.js';

describe('MessageController', () => {
  let controller: MessageController;
  let service: ReturnType<typeof mockService>;

  function mockService() {
    return {
      findAllByConversation: vi.fn(),
    };
  }

  beforeEach(() => {
    service = mockService();
    controller = new MessageController(service as unknown as MessageService);
  });

  it('lists messages for a conversation', async () => {
    service.findAllByConversation.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });

    const result = await controller.findAll('c1', { page: 1, limit: 20 });

    expect(service.findAllByConversation).toHaveBeenCalledWith('c1', { page: 1, limit: 20 });
    expect(result.data).toEqual([]);
  });
});
