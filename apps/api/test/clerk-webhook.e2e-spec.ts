import './env.js';
import { describe, it, beforeAll, afterAll, expect, vi } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { createHmac } from 'crypto';
import { AppModule } from '../src/app.module.js';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { StripeCustomerService } from '../src/payments/stripe/stripe-customer.service.js';

const TEST_WEBHOOK_SECRET = 'whsec_dGVzdHNlY3JldA==';

function signClerkWebhook(
  payload: object,
  id = 'msg_123',
  timestamp = String(Date.now()),
): { id: string; timestamp: string; signature: string; body: string } {
  const body = JSON.stringify(payload);
  const secretBytes = Buffer.from(TEST_WEBHOOK_SECRET.replace('whsec_', ''), 'base64');
  const signedContent = `${id}.${timestamp}.${body}`;
  const signature = createHmac('sha256', secretBytes)
    .update(signedContent)
    .digest('base64');
  return { id, timestamp, signature: `v1,${signature}`, body };
}

describe('Clerk Webhook (e2e)', () => {
  let app: INestApplication;
  let stripeCustomerServiceMock: {
    createOrUpdateCustomer: ReturnType<typeof vi.fn>;
  };

  beforeAll(async () => {
    const prismaMock = {
      user: { findUnique: vi.fn(), upsert: vi.fn() },
      $connect: vi.fn(),
      $disconnect: vi.fn(),
    };

    stripeCustomerServiceMock = {
      createOrUpdateCustomer: vi.fn().mockResolvedValue('cus_synced'),
    };

    const configMock = new ConfigService({
      CLERK_SECRET_KEY: 'sk_test_xxx',
      CLERK_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET,
      DATABASE_URL: 'postgresql://localhost:5432/test',
      REDIS_URL: 'redis://localhost:6379',
      NODE_ENV: 'test',
      PORT: 3001,
    });

    const module = await Test.createTestingModule({
      imports: [AppModule],
    })
      .overrideProvider(ConfigService)
      .useValue(configMock)
      .overrideProvider(PrismaService)
      .useValue(prismaMock)
      .overrideProvider(StripeCustomerService)
      .useValue(stripeCustomerServiceMock)
      .compile();

    app = module.createNestApplication();
    app.setGlobalPrefix('v1');
    app.useBodyParser('json', {
      verify: (req: { rawBody?: Buffer }, res: unknown, buf: Buffer) => {
        req.rawBody = buf;
      },
    });
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 401 for invalid signature', () => {
    return request(app.getHttpServer())
      .post('/v1/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .send('{"type":"user.created","data":{"id":"user_123"}}')
      .set('svix-id', 'msg_123')
      .set('svix-timestamp', String(Date.now()))
      .set('svix-signature', 'v1,badsignature')
      .expect(401);
  });

  it('returns 200 for valid signature', async () => {
    const webhook = signClerkWebhook({
      type: 'user.created',
      data: {
        id: 'user_123',
        email_addresses: [{ id: 'email_1', email_address: 'a@b.com' }],
        primary_email_address_id: 'email_1',
        public_metadata: { role: 'CUSTOMER' },
      },
    });

    await request(app.getHttpServer())
      .post('/v1/webhooks/clerk')
      .set('Content-Type', 'application/json')
      .send(webhook.body)
      .set('svix-id', webhook.id)
      .set('svix-timestamp', webhook.timestamp)
      .set('svix-signature', webhook.signature)
      .expect(200);

    expect(stripeCustomerServiceMock.createOrUpdateCustomer).toHaveBeenCalledWith(
      'user_123',
      'a@b.com',
      undefined,
    );
  });
});
