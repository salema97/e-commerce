import { describe, it, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConsoleEmailProvider } from './console-email.provider.js';

describe('ConsoleEmailProvider', () => {
  it('logs templated emails instead of sending', async () => {
    const module = await Test.createTestingModule({
      providers: [ConsoleEmailProvider],
    }).compile();

    const provider = module.get(ConsoleEmailProvider);
    const logSpy = vi.spyOn(provider['logger'], 'log').mockImplementation(() => {});

    await provider.sendTemplate('customer@example.com', 'ORDER_CONFIRMED', {
      customerName: 'Ana',
      orderNumber: 'ORD-001',
      total: 'USD 10.00',
    });

    expect(logSpy).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'customer@example.com',
        template: 'ORDER_CONFIRMED',
        subject: expect.stringContaining('ORD-001'),
      }),
      'Console email provider would send templated email',
    );
  });
});
