import { describe, it, expect, vi, beforeEach } from 'vitest';
import { WhatsAppController } from './whatsapp.controller.js';
import type { WhatsAppQuickReplyService } from './whatsapp-quick-reply.service.js';

describe('WhatsAppController', () => {
  const quickReplies = [
    { id: 'qr_1', label: 'Saludo', text: '¡Hola! Gracias por contactarnos.' },
    { id: 'qr_2', label: 'Estado del pedido', text: 'Indícanos tu número de orden.' },
    { id: 'qr_3', label: 'Envío', text: 'Tu pedido está en proceso de envío.' },
    { id: 'qr_4', label: 'Horario de atención', text: 'Horario: lunes a viernes 08:00-18:00.' },
    { id: 'qr_5', label: 'Agradecimiento', text: 'Gracias por tu compra.' },
  ];

  let quickReplyService: Pick<WhatsAppQuickReplyService, 'findActive'>;
  let controller: WhatsAppController;

  beforeEach(() => {
    quickReplyService = {
      findActive: vi.fn().mockResolvedValue(quickReplies),
    };
    controller = new WhatsAppController(quickReplyService as WhatsAppQuickReplyService);
  });

  it('returns quick reply templates', async () => {
    const result = await controller.getQuickReplies();

    expect(result).toHaveLength(5);
    expect(result[0]).toHaveProperty('id');
    expect(result[0]).toHaveProperty('label');
    expect(result[0]).toHaveProperty('text');
  });

  it('delegates to WhatsAppQuickReplyService', async () => {
    await controller.getQuickReplies();
    expect(quickReplyService.findActive).toHaveBeenCalled();
  });

  it('returns Spanish labels and text for each reply', async () => {
    const result = await controller.getQuickReplies();

    expect(result.some((r) => r.label.includes('Saludo'))).toBe(true);
    expect(result.some((r) => r.text.toLowerCase().includes('horario'))).toBe(true);
  });
});
