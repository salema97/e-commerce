import { describe, it, expect } from 'vitest';
import { WhatsAppController } from './whatsapp.controller.js';

describe('WhatsAppController', () => {
  const controller = new WhatsAppController();

  it('returns quick reply templates', () => {
    const result = controller.getQuickReplies();

    expect(result.length).toBe(5);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('label');
    expect(result[0]).toHaveProperty('text');
  });

  it('includes the expected quick reply ids', () => {
    const result = controller.getQuickReplies();
    const ids = result.map((r) => r.id);

    expect(ids).toEqual(['greeting', 'order-status', 'shipping', 'hours', 'thanks']);
  });

  it('returns Spanish labels and text for each reply', () => {
    const result = controller.getQuickReplies();

    expect(result.some((r) => r.label.includes('Saludo'))).toBe(true);
    expect(result.some((r) => r.text.toLowerCase().includes('horario'))).toBe(true);
  });
});
