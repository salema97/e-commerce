/** Shared with apps/api/.env.example for local E2E parity. */
export const E2E_EVOLUTION_WEBHOOK_SECRET = 'e2e-evolution-webhook-secret';

export function getEvolutionWebhookSecret(): string {
  return process.env.EVOLUTION_WEBHOOK_SECRET ?? E2E_EVOLUTION_WEBHOOK_SECRET;
}
