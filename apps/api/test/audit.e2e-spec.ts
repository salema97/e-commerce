import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Controller, Post, Module, INestApplication } from '@nestjs/common';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { Audit } from '../src/audit/audit.decorator.js';
import { AuditModule } from '../src/audit/audit.module.js';
import { AuditInterceptor } from '../src/audit/audit.interceptor.js';
import { PrismaService } from '../src/prisma/prisma.service.js';

@Controller('audit-test')
class AuditTestController {
  @Post()
  @Audit({ resource: 'audit-test', action: 'create' })
  create() {
    return { id: 'audit_1', name: 'test' };
  }
}

@Module({
  imports: [AuditModule],
  controllers: [AuditTestController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: AuditInterceptor,
    },
  ],
})
class AuditTestModule {}

describe('Audit logging (e2e)', () => {
  let app: INestApplication;
  let auditLogCreate: ReturnType<typeof vi.fn>;

  beforeAll(async () => {
    auditLogCreate = vi.fn().mockResolvedValue({ id: 'log_1' });
    const prismaMock = {
      auditLog: { create: auditLogCreate },
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    };

    const configMock = new ConfigService({
      DATABASE_URL: 'postgresql://localhost:5432/test',
      NODE_ENV: 'test',
    });

    const module = await Test.createTestingModule({
      imports: [AuditTestModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configMock)
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates an audit log on a mutating endpoint', async () => {
    await request(app.getHttpServer())
      .post('/audit-test')
      .send({})
      .expect(201)
      .expect({ id: 'audit_1', name: 'test' });

    expect(auditLogCreate).toHaveBeenCalledTimes(1);
    expect(auditLogCreate).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          actorClerkUserId: 'system',
          resource: 'audit-test',
          action: 'create',
          resourceId: 'audit_1',
          diff: expect.objectContaining({
            before: null,
            after: { id: 'audit_1', name: 'test' },
            changedFields: ['id', 'name'],
          }),
        }),
      }),
    );
  });
});
