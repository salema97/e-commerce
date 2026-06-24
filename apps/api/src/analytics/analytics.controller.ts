import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { Role } from '../auth/role.enum.js';
import { Public } from '../auth/public.decorator.js';
import { Roles } from '../auth/roles.decorator.js';
import { AnalyticsService } from './analytics.service.js';
import { ReportClientErrorDto, TrackAnalyticsEventDto } from './dto/analytics.dto.js';
import { ErrorTracker } from './error-tracker.interface.js';

@ApiTags('Analytics')
@Controller('analytics')
export class AnalyticsController {
  constructor(
    private readonly analytics: AnalyticsService,
    private readonly errorTracker: ErrorTracker,
  ) {}

  @Post('events')
  @Public()
  @Throttle({ default: { limit: 120, ttl: 60_000 } })
  @ApiOperation({ summary: 'Ingest client analytics event' })
  trackEvent(@Body() dto: TrackAnalyticsEventDto) {
    return this.analytics.trackEvent(dto);
  }

  @Post('errors')
  @Public()
  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @ApiOperation({ summary: 'Report client-side error' })
  reportError(@Body() dto: ReportClientErrorDto) {
    this.errorTracker.captureMessage(dto.message, {
      level: 'error',
      extra: { sessionId: dto.sessionId, ...dto.context },
    });
    return { ok: true };
  }

  @Get('overview')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Analytics overview report' })
  getOverview(@Query('days') days?: string) {
    return this.analytics.getOverview(days ? Number(days) : 30);
  }

  @Get('funnel')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Funnel step counts' })
  getFunnel(@Query('days') days?: string) {
    return this.analytics.getFunnel(days ? Number(days) : 30);
  }

  @Get('cohorts')
  @Roles(Role.SUPER_ADMIN, Role.ADMIN, Role.FINANCE)
  @ApiOperation({ summary: 'Weekly cohort retention report' })
  getCohorts(@Query('weeks') weeks?: string) {
    return this.analytics.getCohortRetention(weeks ? Number(weeks) : 8);
  }

  @Get('feature-flags/:flag')
  @Public()
  @ApiOperation({ summary: 'Check feature flag (PostHog)' })
  checkFeatureFlag(
    @Param('flag') flag: string,
    @Query('distinctId') distinctId?: string,
  ) {
    return this.analytics.isFeatureEnabled(flag, distinctId ?? 'anonymous');
  }
}
