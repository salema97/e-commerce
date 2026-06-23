import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { ResendEmailProvider } from './resend-email.provider.js';

const sendMock = vi.fn();

vi.mock('resend', () => ({
  Resend: class {
    emails = { send: sendMock };
  },
}));

describe('ResendEmailProvider', () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ data: { id: 'email_1' }, error: null });
  });

  it('sends rendered template via Resend', async () => {
    const config = {
      get: (key: string) => {
        if (key === 'RESEND_API_KEY') return 're_test';
        if (key === 'TRANSACTIONAL_EMAIL_FROM') return 'shop@example.com';
        return undefined;
      },
    } as unknown as ConfigService;

    const provider = new ResendEmailProvider(config);

    await provider.sendTemplate('buyer@example.com', 'ORDER_CONFIRMED', {
      customerName: 'Ana',
      orderNumber: 'ORD-1',
      total: 'USD 50.00',
    });

    expect(sendMock).toHaveBeenCalledWith(
      expect.objectContaining({
        from: 'shop@example.com',
        to: 'buyer@example.com',
        subject: expect.stringContaining('ORD-1'),
      }),
    );
  });
});
