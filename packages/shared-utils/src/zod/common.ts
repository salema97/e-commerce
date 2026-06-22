import { z } from 'zod';

export const emailSchema = z
  .string()
  .min(1, 'Email is required')
  .email('Invalid email address');

export const phoneSchema = z
  .string()
  .min(1, 'Phone is required')
  .regex(/^\+[1-9]\d{6,14}$/, 'Phone must be in international format (+593999999999)');

export const slugSchema = z
  .string()
  .min(1, 'Slug is required')
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, 'Slug must be lowercase letters, numbers, and hyphens')
  .max(120, 'Slug must be 120 characters or less');

export const priceSchema = z.number().nonnegative('Price must be zero or positive').finite();

export const quantitySchema = z.number().int('Quantity must be an integer').nonnegative();

export const positiveIntegerSchema = z.number().int().positive();

export const uuidSchema = z.string().uuid();

export const currencySchema = z.string().length(3, 'Currency must be a 3-letter ISO code');
