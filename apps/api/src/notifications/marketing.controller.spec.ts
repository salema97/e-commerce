import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { validate } from 'class-validator';
import 'reflect-metadata';
import { MarketingController } from './marketing.controller.js';
import { MarketingAutomationService } from './marketing-automation.service.js';
import { MarketingPlacementService } from './marketing-placement.service.js';
import { Role } from '../auth/role.enum.js';
import { ROLES_KEY } from '../auth/roles.decorator.js';
import { AUDIT_KEY } from '../audit/audit.decorator.js';
import { ActivePlacementsQueryDto } from './dto/marketing-placement.dto.js';
import { MarketingPlacementPlatform } from '@prisma/client';

describe('MarketingController placements', () => {
  let controller: MarketingController;
  let placements: {
    resolveActive: ReturnType<typeof vi.fn>;
    findAllAdmin: ReturnType<typeof vi.fn>;
    findById: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    placements = {
      resolveActive: vi.fn().mockResolvedValue({}),
      findAllAdmin: vi.fn().mockResolvedValue([]),
      findById: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'new' }),
      update: vi.fn(),
      remove: vi.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [MarketingController],
      providers: [
        {
          provide: MarketingAutomationService,
          useValue: {
            listActivePromotions: vi.fn(),
            distributePromoToSegment: vi.fn(),
          },
        },
        { provide: MarketingPlacementService, useValue: placements },
      ],
    }).compile();

    controller = module.get(MarketingController);
  });

  it('rejects active query without platform via DTO validation', async () => {
    const dto = new ActivePlacementsQueryDto();
    const errors = await validate(dto);
    expect(errors.length).toBeGreaterThan(0);
  });

  it('delegates active placements to service with platform', async () => {
    await controller.findActivePlacements({ platform: MarketingPlacementPlatform.WEB });
    expect(placements.resolveActive).toHaveBeenCalledWith(MarketingPlacementPlatform.WEB);
  });

  it('restricts admin list to SUPER_ADMIN and ADMIN roles', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, controller.listPlacementsAdmin);
    expect(roles).toEqual([Role.SUPER_ADMIN, Role.ADMIN]);
    expect(roles).not.toContain(Role.FINANCE);
  });

  it('requires audit metadata on placement create', () => {
    const audit = Reflect.getMetadata(AUDIT_KEY, controller.createPlacement);
    expect(audit).toEqual({ resource: 'marketing_placement', action: 'create' });
  });

  it('delegates placement create to service', async () => {
    const dto = {
      name: 'Banner',
      type: 'BANNER' as const,
      slot: 'HOME_HERO' as const,
      title: 'Hello',
    };

    await controller.createPlacement(dto as never);

    expect(placements.create).toHaveBeenCalledWith(dto);
  });
});
