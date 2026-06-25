import { Injectable } from '@nestjs/common';
import { ConfiguredWhatsAppProvider } from './configured-whatsapp.provider.js';

@Injectable()
export class WhatsAppProviderWiring {
  constructor(private readonly whatsapp: ConfiguredWhatsAppProvider) {}
}
