import { Injectable } from '@nestjs/common';
import { ConfiguredEmailProvider } from './configured-email.provider.js';

/** Keeps configured strategy providers in the Nest DI graph for static analysis. */
@Injectable()
export class EmailProviderWiring {
  constructor(private readonly configured: ConfiguredEmailProvider) {}
}
