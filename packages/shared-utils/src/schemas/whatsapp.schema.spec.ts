import { describe, it, expect } from 'vitest';
import {
  ecuadorPhoneSchema,
  webhookPayloadSchema,
  messageContentSchema,
} from './whatsapp.schema.js';

describe('ecuadorPhoneSchema', () => {
  it('accepts E.164 format with +593', () => {
    const result = ecuadorPhoneSchema.safeParse('+593991234567');
    expect(result.success).toBe(true);
    expect(result.data).toBe('+593991234567');
  });

  it('normalizes 593XXXXXXXXX to +593XXXXXXXXX', () => {
    const result = ecuadorPhoneSchema.safeParse('593991234567');
    expect(result.success).toBe(true);
    expect(result.data).toBe('+593991234567');
  });

  it('normalizes 09XXXXXXXX to +593XXXXXXXXX', () => {
    const result = ecuadorPhoneSchema.safeParse('0991234567');
    expect(result.success).toBe(true);
    expect(result.data).toBe('+593991234567');
  });

  it('normalizes 9XXXXXXXX to +593XXXXXXXXX', () => {
    const result = ecuadorPhoneSchema.safeParse('991234567');
    expect(result.success).toBe(true);
    expect(result.data).toBe('+593991234567');
  });

  it('rejects non-Ecuador country codes', () => {
    const result = ecuadorPhoneSchema.safeParse('+1234567890');
    expect(result.success).toBe(false);
  });

  it('rejects numbers that are too short', () => {
    const result = ecuadorPhoneSchema.safeParse('+59399123456');
    expect(result.success).toBe(false);
  });

  it('rejects numbers that are too long', () => {
    const result = ecuadorPhoneSchema.safeParse('+5939912345678');
    expect(result.success).toBe(false);
  });

  it('rejects empty strings', () => {
    const result = ecuadorPhoneSchema.safeParse('');
    expect(result.success).toBe(false);
  });
});

describe('webhookPayloadSchema', () => {
  it('accepts a valid messages.upsert payload', () => {
    const payload = {
      event: 'messages.upsert',
      instance: 'ecommerce',
      data: { key: { id: 'msg_1' } },
    };
    const result = webhookPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('accepts a valid messages.update payload', () => {
    const payload = {
      event: 'messages.update',
      data: { key: { id: 'msg_1' }, status: 'DELIVERED' },
    };
    const result = webhookPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('accepts a valid connection.update payload', () => {
    const payload = {
      event: 'connection.update',
      data: { state: 'open' },
    };
    const result = webhookPayloadSchema.safeParse(payload);
    expect(result.success).toBe(true);
  });

  it('rejects unknown event types', () => {
    const result = webhookPayloadSchema.safeParse({
      event: 'messages.delete',
      data: {},
    });
    expect(result.success).toBe(false);
  });

  it('rejects missing event field', () => {
    const result = webhookPayloadSchema.safeParse({ data: {} });
    expect(result.success).toBe(false);
  });

  it('accepts payload without optional instance and data', () => {
    const result = webhookPayloadSchema.safeParse({ event: 'connection.update' });
    expect(result.success).toBe(true);
  });
});

describe('messageContentSchema', () => {
  it('accepts non-empty text', () => {
    const result = messageContentSchema.safeParse('Hello, world!');
    expect(result.success).toBe(true);
  });

  it('rejects empty strings', () => {
    const result = messageContentSchema.safeParse('');
    expect(result.success).toBe(false);
  });

  it('rejects whitespace-only strings', () => {
    const result = messageContentSchema.safeParse('   ');
    expect(result.success).toBe(false);
  });

  it('rejects content over 4096 characters', () => {
    const result = messageContentSchema.safeParse('a'.repeat(4097));
    expect(result.success).toBe(false);
  });

  it('accepts content at exactly 4096 characters', () => {
    const result = messageContentSchema.safeParse('a'.repeat(4096));
    expect(result.success).toBe(true);
  });

  it('rejects non-string values', () => {
    const result = messageContentSchema.safeParse(123);
    expect(result.success).toBe(false);
  });
});
