import { z } from 'zod';
import { normalizeEcuadorPhone } from '../validators/ecuador.js';

/**
 * Ecuador mobile phone number in E.164 format.
 *
 * Accepts common local inputs (`09XXXXXXXX`, `9XXXXXXXX`, `593XXXXXXXXX`,
 * `+593XXXXXXXXX`) and normalizes them to `+593XXXXXXXXX`.
 */
export const ecuadorPhoneSchema = z
  .string({ message: 'Phone must be a string' })
  .min(1, 'Phone is required')
  .transform((value) => {
    const digits = value.replace(/\D/g, '');
    if (digits.length === 12 && digits.startsWith('593')) {
      return `+${digits}`;
    }
    return normalizeEcuadorPhone(value);
  })
  .refine((value) => /^\+593\d{9}$/.test(value), {
    message: 'Phone must be a valid Ecuador E.164 number (+593XXXXXXXXX)',
  });

export type EcuadorPhone = z.infer<typeof ecuadorPhoneSchema>;

/**
 * Known Evolution API webhook event types.
 */
export const evolutionEventTypeSchema = z.enum([
  'messages.upsert',
  'messages.update',
  'connection.update',
]);

export type EvolutionEventType = z.infer<typeof evolutionEventTypeSchema>;

/**
 * Evolution API webhook payload.
 *
 * The `event` field guards the event type; `instance` identifies the Evolution
 * instance; `data` is provider-specific and left loosely typed.
 */
export const webhookPayloadSchema = z.object({
  event: evolutionEventTypeSchema,
  instance: z.string().optional(),
  data: z.unknown().optional(),
});

export type WebhookPayload = z.infer<typeof webhookPayloadSchema>;

/**
 * Text message content for WhatsApp conversations.
 *
 * WhatsApp supports text messages up to 4096 characters.
 */
export const messageContentSchema = z
  .string({ message: 'Message content must be a string' })
  .min(1, 'Message content is required')
  .max(4096, 'Message content must be 4096 characters or less')
  .refine((value) => value.trim().length > 0, {
    message: 'Message content cannot be whitespace only',
  });

export type MessageContent = z.infer<typeof messageContentSchema>;
