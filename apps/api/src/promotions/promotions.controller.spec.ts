import { describe, it, expect, beforeEach, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import 'reflect-metadata';
import { PromotionsController } from './promotions.controller.js';
import { PromotionsService } from './promotions.service.js';
import { Role } from '../auth/role.enum.js';
import { ROLES_KEY } from '../auth/roles.decorator.js';
import { AUDIT_KEY } from '../audit/audit.decorator.js';
import { PromotionType } from '@prisma/client';

describe('PromotionsController', () => {
  let controller: PromotionsController;
  let promotions: {
    findAll: ReturnType<typeof vi.fn>;
    findOne: ReturnType<typeof vi.fn>;
    create: ReturnType<typeof vi.fn>;
    update: ReturnType<typeof vi.fn>;
    remove: ReturnType<typeof vi.fn>;
    createCoupon: ReturnType<typeof vi.fn>;
  };

  beforeEach(async () => {
    promotions = {
      findAll: vi.fn().mockResolvedValue([]),
      findOne: vi.fn(),
      create: vi.fn().mockResolvedValue({ id: 'p1' }),
      update: vi.fn(),
      remove: vi.fn(),
      createCoupon: vi.fn(),
    };

    const module = await Test.createTestingModule({
      controllers: [PromotionsController],
      providers: [{ provide: PromotionsService, useValue: promotions }],
    }).compile();

    controller = module.get(PromotionsController);
  });

  it('restricts list to SUPER_ADMIN and ADMIN roles', () => {
    const roles = Reflect.getMetadata(ROLES_KEY, controller.findAll);
    expect(roles).toEqual([Role.SUPER_ADMIN, Role.ADMIN]);
    expect(roles).not.toContain(Role.FINANCE);
  });

  it('requires audit metadata on promotion create', () => {
    const audit = Reflect.getMetadata(AUDIT_KEY, controller.create);
    expect(audit).toEqual({ resource: 'promotion', action: 'create' });
  });

  it('delegates create to service', async () => {
    const dto = {
      name: 'Summer',
      type: PromotionType.PERCENTAGE,
      value: 10,
    };
    await controller.create(dto);
    expect(promotions.create).toHaveBeenCalledWith(dto);
  });

  it('delegates findAll with query', async () => {
    await controller.findAll({ isActive: true });
    expect(promotions.findAll).toHaveBeenCalledWith({ isActive: true });
  });
});
