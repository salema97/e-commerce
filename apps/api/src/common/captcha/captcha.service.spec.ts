import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { CaptchaService } from './captcha.service.js';

describe('CaptchaService', () => {
  let service: CaptchaService;

  beforeEach(() => {
    service = new CaptchaService(
      { get: vi.fn((key: string, def?: string) => (key === 'CAPTCHA_PROVIDER' ? 'none' : def)) } as unknown as ConfigService,
    );
  });

  it('skips when disabled', async () => {
    await expect(service.verifyOrSkip(undefined)).resolves.toBeUndefined();
  });
});
