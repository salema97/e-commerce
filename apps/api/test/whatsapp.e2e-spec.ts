import './env.js';
import { createE2eTestingModule } from './e2e-module.js';
import { describe, it, beforeAll, afterAll, beforeEach, expect, vi } from 'vitest';
import { INestApplication } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import request from 'supertest';
import { createHmac } from 'crypto';
import { PrismaService } from '../src/prisma/prisma.service.js';
import { WhatsAppProvider } from '../src/whatsapp/whatsapp-provider.interface.js';
import { RedisIdempotencyService } from '../src/common/redis/idempotency.service.js';
import { BASE_TEST_CONFIG, bearerAuth } from './test-config.js';

const TEST_WEBHOOK_SECRET = 'whsec_evolution_test';

function signEvolutionWebhook(payload: object): { signature: string; body: string } {
  const body = JSON.stringify(payload);
  const signature = createHmac('sha256', TEST_WEBHOOK_SECRET).update(body).digest('hex');
  return { signature, body };
}

function makeInboundPayload(overrides: {
  remoteJid?: string;
  externalMessageId?: string;
  content?: string;
  contactName?: string;
} = {}) {
  const remoteJid = overrides.remoteJid ?? '+593991234567@s.whatsapp.net';
  const externalMessageId = overrides.externalMessageId ?? 'msg-inbound-1';
  const content = overrides.content ?? 'Hola, necesito ayuda';
  const contactName = overrides.contactName ?? 'Cliente de prueba';

  return {
    event: 'messages.upsert',
    instance: 'ecommerce',
    data: {
      key: { remoteJid, id: externalMessageId, fromMe: false },
      pushName: contactName,
      message: { conversation: content },
      messageTimestamp: Math.floor(Date.now() / 1000),
    },
  };
}

describe('WhatsApp integration (e2e)', () => {
  let app: INestApplication;
  let prismaMock: ReturnType<typeof mockPrisma>;
  let providerMock: ReturnType<typeof mockProvider>;
  let idempotencyClaim: ReturnType<typeof vi.fn>;

  function mockProvider() {
    return {
      sendText: vi.fn(),
      verifyWebhookSignature: vi.fn((payload: Buffer, signature: string) => {
        const expected = createHmac('sha256', TEST_WEBHOOK_SECRET).update(payload).digest('hex');
        return signature === expected;
      }),
    };
  }

  function mockPrisma() {
    const conversation = {
      id: 'c1',
      remoteJid: '593991234567',
      instance: 'ecommerce',
      contactName: 'Cliente de prueba',
      status: 'OPEN',
      assignedAgentId: null,
      lastMessageAt: new Date(),
      unreadCount: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return {
      $connect: vi.fn(),
      $disconnect: vi.fn(),
      $queryRaw: vi.fn().mockResolvedValue([{ 1: 1 }]),
      conversation: {
        findFirst: vi.fn().mockResolvedValue(null),
        findUnique: vi.fn().mockResolvedValue(conversation),
        findMany: vi.fn().mockResolvedValue([conversation]),
        count: vi.fn().mockResolvedValue(1),
        create: vi.fn().mockResolvedValue(conversation),
        update: vi.fn().mockResolvedValue(conversation),
      },
      message: {
        findMany: vi.fn().mockResolvedValue([]),
        count: vi.fn().mockResolvedValue(0),
        create: vi.fn().mockImplementation((args: { data: Record<string, unknown> }) =>
          Promise.resolve({
            id: 'm1',
            ...args.data,
            createdAt: new Date(),
            updatedAt: new Date(),
          }),
        ),
        updateMany: vi.fn().mockResolvedValue({ count: 1 }),
      },
      auditLog: {
        create: vi.fn().mockResolvedValue({ id: 'audit-1' }),
      },
    };
  }

  beforeAll(async () => {
    prismaMock = mockPrisma();
    providerMock = mockProvider();
    idempotencyClaim = vi.fn().mockResolvedValue(true);

    const configMock = new ConfigService({
      ...BASE_TEST_CONFIG,
      EVOLUTION_API_URL: 'http://localhost:8080',
      EVOLUTION_API_KEY: 'evolution-test-key',
      EVOLUTION_WEBHOOK_SECRET: TEST_WEBHOOK_SECRET,
      EVOLUTION_INSTANCE_NAME: 'ecommerce',
      SRI_MODE: 'direct',
      SRI_RUC: '1792146739001',
      SRI_SOL_KEY: 'test',
      SRI_DIGITAL_CERTIFICATE_PATH: 'data:test',
      SRI_DIGITAL_CERTIFICATE_PASSWORD: 'test',
      SRI_ESTABLISHMENT_CODE: '001',
      SRI_EMISSION_POINT_CODE: '001',
      SRI_TEST_ENVIRONMENT: 'true',
      SRI_QUEUE_ENABLED: 'false',
    });

    const module = await createE2eTestingModule()
      .overrideProvider(ConfigService)
      .useValue(configMock)
      .overrideProvider(PrismaService)
      .useValue(prismaMock as never)
      .overrideProvider(WhatsAppProvider)
      .useValue(providerMock)
      .overrideProvider(RedisIdempotencyService)
      .useValue({ claim: idempotencyClaim })
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

  beforeEach(() => {
    idempotencyClaim.mockReset().mockResolvedValue(true);
    providerMock.sendText.mockReset();
    providerMock.verifyWebhookSignature.mockImplementation((payload: Buffer, signature: string) => {
      const expected = createHmac('sha256', TEST_WEBHOOK_SECRET).update(payload).digest('hex');
      return signature === expected;
    });
    vi.clearAllMocks();
  });

  it('accepts a valid inbound webhook and creates a conversation and message', async () => {
    const payload = makeInboundPayload();
    const webhook = signEvolutionWebhook(payload);

    await request(app.getHttpServer())
      .post('/v1/webhooks/evolution/messages.upsert')
      .set('Content-Type', 'application/json')
      .set('x-evolution-api-signature', webhook.signature)
      .send(webhook.body)
      .expect(204);

    expect(prismaMock.conversation.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          remoteJid: '593991234567',
          instance: 'ecommerce',
          status: 'OPEN',
          contactName: 'Cliente de prueba',
        }),
      }),
    );

    expect(prismaMock.message.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          conversationId: 'c1',
          direction: 'INBOUND',
          content: 'Hola, necesito ayuda',
          externalMessageId: 'msg-inbound-1',
        }),
      }),
    );
  });

  it('rejects an inbound webhook with an invalid signature', async () => {
    const payload = makeInboundPayload({ externalMessageId: 'msg-inbound-2' });
    const body = JSON.stringify(payload);

    await request(app.getHttpServer())
      .post('/v1/webhooks/evolution/messages.upsert')
      .set('Content-Type', 'application/json')
      .set('x-evolution-api-signature', 'invalid-signature')
      .send(body)
      .expect(401);

    expect(prismaMock.conversation.create).not.toHaveBeenCalled();
  });

  it('deduplicates identical webhook payloads', async () => {
    const payload = makeInboundPayload({ externalMessageId: 'msg-dedup-1' });
    const webhook = signEvolutionWebhook(payload);

    idempotencyClaim.mockResolvedValueOnce(false);

    await request(app.getHttpServer())
      .post('/v1/webhooks/evolution/messages.upsert')
      .set('Content-Type', 'application/json')
      .set('x-evolution-api-signature', webhook.signature)
      .send(webhook.body)
      .expect(204);

    expect(prismaMock.message.create).not.toHaveBeenCalled();
  });

  it('allows a support agent to send an outbound reply', async () => {
    providerMock.sendText.mockResolvedValue({
      providerMessageId: 'msg-outbound-1',
      status: 'SENT',
    });

    const res = await request(app.getHttpServer())
      .post('/v1/conversations/c1/messages')
      .set(bearerAuth('support_agent_1', 'SUPPORT'))
      .send({ content: 'Gracias por contactarnos' })
      .expect(201);

    expect(providerMock.sendText).toHaveBeenCalledWith('593991234567', 'Gracias por contactarnos');
    expect(res.body.direction).toBe('OUTBOUND');
    expect(res.body.content).toBe('Gracias por contactarnos');
    expect(res.body.status).toBe('SENT');
    expect(res.body.externalMessageId).toBe('msg-outbound-1');
  });

  it('persists a FAILED outbound message when the provider errors', async () => {
    providerMock.sendText.mockRejectedValue(new Error('Evolution API timeout'));

    const res = await request(app.getHttpServer())
      .post('/v1/conversations/c1/messages')
      .set(bearerAuth('support_agent_1', 'SUPPORT'))
      .send({ content: 'Mensaje que falla' })
      .expect(201);

    expect(res.body.status).toBe('FAILED');
    expect(res.body.errorMessage).toBe('Evolution API timeout');
  });

  it('allows a support agent to update conversation status and assignment', async () => {
    prismaMock.conversation.update.mockResolvedValueOnce({
      id: 'c1',
      status: 'RESOLVED',
      assignedAgentId: 'support_agent_1',
    });

    const res = await request(app.getHttpServer())
      .patch('/v1/conversations/c1')
      .set(bearerAuth('support_agent_1', 'SUPPORT'))
      .send({ status: 'RESOLVED', assignedAgentId: 'support_agent_1' })
      .expect(200);

    expect(res.body.status).toBe('RESOLVED');
    expect(res.body.assignedAgentId).toBe('support_agent_1');
  });
});
