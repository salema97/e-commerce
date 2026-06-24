import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AccountingProviderType } from '@prisma/client';
import { ConsoleAccountingProvider } from './console-accounting.provider.js';
import { SiigoAccountingProvider } from './siigo-accounting.provider.js';
import type { AccountingProvider } from './accounting-provider.interface.js';

@Injectable()
export class AccountingProviderFactory {
  constructor(
    private readonly config: ConfigService,
    private readonly consoleProvider: ConsoleAccountingProvider,
    private readonly siigoProvider: SiigoAccountingProvider,
  ) {}

  getProvider(): AccountingProvider {
    const selected = this.config.get<string>('ACCOUNTING_PROVIDER', 'console').toUpperCase();
    switch (selected) {
      case AccountingProviderType.SIIGO:
        return this.siigoProvider;
      case AccountingProviderType.ALEGRA:
        return this.siigoProvider;
      case AccountingProviderType.CONSOLE:
      default:
        return this.consoleProvider;
    }
  }

  listProfiles() {
    return [
      { id: AccountingProviderType.CONSOLE, name: 'Console (dev)', regions: ['*'] },
      { id: AccountingProviderType.SIIGO, name: 'Siigo', regions: ['CO', 'LATAM'] },
      { id: AccountingProviderType.ALEGRA, name: 'Alegra', regions: ['CO', 'MX', 'LATAM'] },
    ];
  }
}
