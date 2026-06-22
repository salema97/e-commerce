import type { Role } from './enums.js';

export interface ClerkWebhookEmail {
  id: string;
  email_address: string;
}

export interface ClerkWebhookPhone {
  id: string;
  phone_number: string;
}

export interface ClerkWebhookData {
  id: string;
  email_addresses?: ClerkWebhookEmail[];
  primary_email_address_id?: string;
  phone_numbers?: ClerkWebhookPhone[];
  primary_phone_number_id?: string;
  public_metadata?: { role?: Role };
}

export interface ClerkWebhookPayload {
  type: string;
  data: ClerkWebhookData;
}

export interface ClerkWebhookResponse {
  success: boolean;
}
