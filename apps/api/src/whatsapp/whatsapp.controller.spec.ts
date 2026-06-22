import { describe, it, expect } from 'vitest';
import { WhatsAppController } from './whatsapp.controller.js';

describe('WhatsAppController', () => {
  const controller = new WhatsAppController();

  it('returns quick reply templates', () => {
    const result = controller.getQuickReplies();

    expect(result.length).toBeGreaterThan(0);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('label');
    expect(result[0]).toHaveProperty('text');
  });
});
