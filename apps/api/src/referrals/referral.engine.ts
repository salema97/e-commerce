import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class ReferralEngine {
  constructor(private readonly config: ConfigService) {}

  get commissionRate(): number {
    return this.config.get<number>('REFERRAL_COMMISSION_RATE', 0.05);
  }

  calculateCommission(orderTotal: number): number {
    return Number((orderTotal * this.commissionRate).toFixed(2));
  }

  buildReferralLink(code: string): string {
    const base =
      this.config.get<string>('STOREFRONT_URL') ??
      this.config.get<string>('STRIPE_SUCCESS_URL')?.replace(/\/checkout\/success.*$/, '') ??
      'http://localhost:3000';
    return `${base}/store?ref=${encodeURIComponent(code)}`;
  }

  normalizeCode(code: string): string {
    return code.trim().toUpperCase();
  }
}
