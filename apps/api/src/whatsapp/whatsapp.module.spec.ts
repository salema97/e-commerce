import { describe, it, expect, beforeEach } from 'vitest';
import { Test } from '@nestjs/testing';
import { ConfigModule } from '@nestjs/config';
import { WhatsAppModule } from './whatsapp.module.js';
import { WhatsAppProvider } from './whatsapp-provider.interface.js';
import { EvolutionApiProvider } from './providers/evolution-api.provider.js';

describe('WhatsAppModule', () => {
  beforeEach(() => {
    process.env.EVOLUTION_API_URL = 'http://localhost:8080';
    process.env.EVOLUTION_API_KEY = 'apikey_xxx';
    process.env.EVOLUTION_WEBHOOK_SECRET = 'whsec_xxx';
    process.env.EVOLUTION_INSTANCE_NAME = 'ecommerce';
  });

  it('compiles and exports the WhatsAppProvider token bound to EvolutionApiProvider', async () => {
    const module = await Test.createTestingModule({
      imports: [ConfigModule.forRoot({ isGlobal: true }), WhatsAppModule],
    }).compile();

    const provider = module.get(WhatsAppProvider);

    expect(provider).toBeInstanceOf(EvolutionApiProvider);
  });
});
