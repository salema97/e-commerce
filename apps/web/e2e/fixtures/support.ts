import { APIRequestContext } from '@playwright/test';
import { createHmac } from 'crypto';
import { getEvolutionWebhookSecret } from './webhook-secret.js';
import { E2E_API_BASE } from './api-base.js';

export interface CreateConversationResult {
  remoteJid: string;
  externalMessageId: string;
}

export async function createConversationViaWebhook(
  request: APIRequestContext,
  overrides: {
    remoteJid?: string;
    externalMessageId?: string;
    content?: string;
    contactName?: string;
  } = {},
): Promise<CreateConversationResult> {
  const remoteJid = overrides.remoteJid ?? `+5939${String(Date.now()).slice(-8)}@s.whatsapp.net`;
  const externalMessageId = overrides.externalMessageId ?? `msg-${Date.now()}`;
  const content = overrides.content ?? 'Hola, necesito ayuda';
  const contactName = overrides.contactName ?? 'Test Customer';

  const payload = {
    event: 'messages.upsert',
    instance: 'ecommerce',
    data: {
      key: { remoteJid, id: externalMessageId, fromMe: false },
      pushName: contactName,
      message: { conversation: content },
      messageTimestamp: Math.floor(Date.now() / 1000),
    },
  };

  const body = JSON.stringify(payload);
  const signature = createHmac('sha256', getEvolutionWebhookSecret()).update(body).digest('hex');

  const response = await request.post(`${E2E_API_BASE}/webhooks/evolution/messages.upsert`, {
    data: body,
    headers: {
      'Content-Type': 'application/json',
      'x-evolution-api-signature': signature,
    },
  });

  if (!response.ok()) {
    throw new Error(`Failed to create conversation via webhook: ${await response.text()}`);
  }

  return { remoteJid, externalMessageId };
}
