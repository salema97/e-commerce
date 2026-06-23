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

    await provider.sendTemplate('customer@example.com', 'sri-invoice-delivery', {
      orderNumber: 'ORD-001',
      pdfUrl: 'https://example.com/ride.pdf',
    });

    expect(logSpy).toHaveBeenCalledWith(
      {
        to: 'customer@example.com',
        template: 'sri-invoice-delivery',
        vars: {
          orderNumber: 'ORD-001',
          pdfUrl: 'https://example.com/ride.pdf',
        },
      },
      'Console email provider would send templated email',
    );
  });
});
