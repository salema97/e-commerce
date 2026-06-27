import type { ConfigService } from '@nestjs/config';
import { parseBooleanEnv } from './sri-xml.utils.js';

export interface SriCompanyConfig {
  ruc: string;
  name: string;
  tradeName: string;
  address: string;
  requiresAccounting: boolean;
  specialTaxpayerNumber?: string;
}

export type ConfigReader = Pick<ConfigService, 'get' | 'getOrThrow'>;

export function createEnvConfigReader(env: NodeJS.ProcessEnv): ConfigReader {
  return {
    get: <T>(key: string) => env[key] as T | undefined,
    getOrThrow: <T>(key: string) => {
      const value = env[key];
      if (value === undefined || value === '') {
        throw new Error(`Missing environment variable: ${key}`);
      }
      return value as T;
    },
  };
}

export function readSriCompanyConfig(source: ConfigReader): SriCompanyConfig {
  const name = source.getOrThrow<string>('SRI_COMPANY_NAME');

  return {
    ruc: source.getOrThrow<string>('SRI_RUC'),
    name,
    tradeName: source.get<string>('SRI_COMPANY_TRADE_NAME') ?? name,
    address: source.get<string>('SRI_COMPANY_ADDRESS') ?? 'Direccion matriz',
    requiresAccounting: parseBooleanEnv(
      source.get<string>('SRI_COMPANY_REQUIRES_ACCOUNTING'),
      true,
    ),
    specialTaxpayerNumber: source.get<string>(
      'SRI_COMPANY_SPECIAL_TAXPAYER_NUMBER',
    ),
  };
}

export function mapSriCompanyToXmlFields(company: SriCompanyConfig): {
  companyRuc: string;
  companyName: string;
  companyTradeName: string;
  companyAddress: string;
  requiresAccounting: boolean;
  specialTaxpayerNumber?: string;
} {
  return {
    companyRuc: company.ruc,
    companyName: company.name,
    companyTradeName: company.tradeName,
    companyAddress: company.address,
    requiresAccounting: company.requiresAccounting,
    specialTaxpayerNumber: company.specialTaxpayerNumber,
  };
}
