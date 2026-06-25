import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { ExternalReviewSummary } from '@repo/shared-types';

@Injectable()
export class ExternalReviewsService {
  constructor(private readonly config: ConfigService) {}

  getStoreSummary(): ExternalReviewSummary {
    const provider = this.config.get<string>('EXTERNAL_REVIEW_PROVIDER', 'console');

    if (provider === 'google') {
      return {
        provider: 'google',
        rating: Number(this.config.get<string>('GOOGLE_REVIEWS_RATING', '4.8')),
        reviewCount: Number(this.config.get<string>('GOOGLE_REVIEWS_COUNT', '120')),
        profileUrl: this.config.get<string>('GOOGLE_REVIEWS_URL'),
      };
    }

    if (provider === 'trustpilot') {
      return {
        provider: 'trustpilot',
        rating: Number(this.config.get<string>('TRUSTPILOT_RATING', '4.6')),
        reviewCount: Number(this.config.get<string>('TRUSTPILOT_REVIEW_COUNT', '85')),
        profileUrl: this.config.get<string>('TRUSTPILOT_PROFILE_URL'),
      };
    }

    return {
      provider: 'console',
      rating: 4.7,
      reviewCount: 0,
    };
  }
}
