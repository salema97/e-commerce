import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConversationController } from './conversation.controller.js';
import { ConversationService } from './conversation.service.js';

describe('ConversationController', () => {
  let controller: ConversationController;
  let service: ReturnType<typeof mockService>;

  function mockService() {
    return {
      findAll: vi.fn(),
      findOne: vi.fn(),
      update: vi.fn(),
    };
  }

  beforeEach(() => {
    service = mockService();
    controller = new ConversationController(service as unknown as ConversationService);
  });

  it('lists conversations for the current user', async () => {
    service.findAll.mockResolvedValue({ data: [], meta: { page: 1, limit: 20, total: 0, totalPages: 0 } });
    const query = { status: 'OPEN' } as never;
    const result = await controller.findAll(query, 'u1');
    expect(service.findAll).toHaveBeenCalledWith(query, 'u1');
    expect(result.data).toEqual([]);
  });

  it('finds one conversation', async () => {
    service.findOne.mockResolvedValue({ id: 'c1' });
    const result = await controller.findOne('c1');
    expect(service.findOne).toHaveBeenCalledWith('c1');
    expect(result.id).toBe('c1');
  });

  it('updates a conversation', async () => {
    service.update.mockResolvedValue({ id: 'c1', status: 'PENDING' });
    const dto = { status: 'PENDING' as const, assignedAgentId: 'u1' };
    const result = await controller.update('c1', dto);
    expect(service.update).toHaveBeenCalledWith('c1', dto);
    expect(result.status).toBe('PENDING');
  });
});
