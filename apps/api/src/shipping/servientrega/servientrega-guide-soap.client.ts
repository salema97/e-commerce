import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type * as soap from 'soap';
import type { ServientregaEnvioExterno, ServientregaGuideCreateResult, ServientregaSoapAuth } from './servientrega-fulfillment.types.js';
import {
  callSoapMethodWithTimeout,
  createServientregaSoapClient,
  extractGuideNumbers,
} from './servientrega-soap.util.js';

@Injectable()
export class ServientregaGuideSoapClient {
  private readonly logger = new Logger(ServientregaGuideSoapClient.name);

  constructor(private readonly config: ConfigService) {}

  isConfigured(): boolean {
    return Boolean(this.getAuth());
  }

  getAuth(): ServientregaSoapAuth | null {
    const login = this.config.get<string>('SERVIENTREGA_LOGIN')?.trim();
    const password = this.config.get<string>('SERVIENTREGA_PASSWORD')?.trim();
    const billingCode = this.config.get<string>('SERVIENTREGA_BILLING_CODE')?.trim();
    const loadName = this.config.get<string>('SERVIENTREGA_LOAD_NAME')?.trim();
    if (!login || !password || !billingCode || !loadName) return null;
    return { login, password, billingCode, loadName };
  }

  getWsdlUrl(): string {
    return (
      this.config.get<string>('SERVIENTREGA_GUIDE_WSDL_URL') ??
      'http://web.servientrega.com:8081/GeneracionGuias.asmx?wsdl'
    );
  }

  async createGuide(envio: ServientregaEnvioExterno): Promise<ServientregaGuideCreateResult> {
    const auth = this.getAuth();
    if (!auth) {
      throw new Error('Servientrega SOAP credentials are not configured');
    }

    const client = await createServientregaSoapClient(this.getWsdlUrl());
    this.applyAuthHeader(client, auth);

    const payload = {
      envios: {
        CargueMasivoExternoDTO: {
          objEnvios: {
            EnviosExterno: envio,
          },
        },
      },
      arrayGuias: {
        string: [],
      },
    };

    const method = this.resolveAsyncMethod(client, 'CargueMasivoExterno');
    const [result] = await callSoapMethodWithTimeout(method(payload) as Promise<[unknown]>);

    const guideNumbers = extractGuideNumbers(result);
    if (!guideNumbers.length) {
      this.logger.warn({ result }, 'Servientrega guide response without guide number');
      throw new Error('Servientrega did not return a guide number');
    }

    return { guideNumbers, raw: result };
  }

  private applyAuthHeader(client: soap.Client, auth: ServientregaSoapAuth) {
    client.addSoapHeader(
      {
        AuthHeader: {
          login: auth.login,
          pwd: auth.password,
          Id_CodFacturacion: auth.billingCode,
          Nombre_Cargue: auth.loadName,
        },
      },
      'http://tempuri.org/',
      'tns',
      'http://tempuri.org/',
    );
  }

  private resolveAsyncMethod(client: soap.Client, methodName: string) {
    const asyncName = `${methodName}Async`;
    const clientRecord = client as unknown as Record<string, unknown>;
    const method = clientRecord[asyncName];
    if (typeof method !== 'function') {
      throw new Error(`Servientrega SOAP method ${asyncName} is not available`);
    }
    return method.bind(client) as (payload: unknown) => Promise<[unknown]>;
  }
}
