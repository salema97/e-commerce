import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class CaptchaService {
  private readonly logger = new Logger(CaptchaService.name);

  constructor(private readonly config: ConfigService) {}

  get isEnabled(): boolean {
    return this.config.get<string>('CAPTCHA_PROVIDER', 'none') === 'hcaptcha';
  }

  async verifyOrSkip(token: string | undefined): Promise<void> {
    if (!this.isEnabled) return;

    const secret = this.config.get<string>('HCAPTCHA_SECRET_KEY');
    if (!secret) {
      this.logger.warn('CAPTCHA_PROVIDER=hcaptcha but HCAPTCHA_SECRET_KEY missing; skipping');
      return;
    }

    if (!token?.trim()) {
      throw new BadRequestException('Captcha token required');
    }

    const body = new URLSearchParams({ secret, response: token });
    const res = await fetch('https://hcaptcha.com/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body,
    });

    const data = (await res.json()) as { success?: boolean };
    if (!data.success) {
      throw new BadRequestException('Captcha verification failed');
    }
  }
}
