import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promisify } from 'node:util';
import * as soap from 'soap';

const SOAP_TIMEOUT_MS = 30_000;

type SoapCreateClient = (
  url: string,
  options: { wsdl_options: { timeout: number } },
  callback: (err: Error | null, client: soap.Client) => void,
) => void;

const createSoapClientAsync = promisify(soap.createClient as SoapCreateClient);

export interface SriReceptionResponse {
  estado: string;
  comprobantes?: Array<{
    claveAcceso: string;
    mensajes?: Array<{ identificador: string; mensaje: string; tipo: string }>;
  }>;
}

export interface SriAuthorizationResponse {
  autorizaciones?: Array<{
    estado: string;
    numeroAutorizacion: string;
    fechaAutorizacion: string;
    ambiente: string;
    comprobante?: string;
    mensajes?: Array<{ identificador: string; mensaje: string; tipo: string }>;
  }>;
}

@Injectable()
export class SriSoapClient {
  private readonly logger = new Logger(SriSoapClient.name);

  constructor(private readonly configService: ConfigService) {}

  async submit(xml: string): Promise<SriReceptionResponse> {
    const client = await this.createClient(this.getRecepcionUrl());
    const [result] = await this.callWithTimeout(
      client.recepcionComprobantesOfflineAsync({ xml }) as Promise<[unknown]>,
    );
    return this.parseReceptionResponse(result);
  }

  async poll(accessKey: string): Promise<SriAuthorizationResponse> {
    const maxRetries = 5;
    const delays = [2_000, 4_000, 8_000, 16_000, 32_000];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const parsed = await this.queryStatus(accessKey);

      const authorization = parsed.autorizaciones?.[0];
      if (
        authorization?.estado === 'AUTORIZADO' ||
        authorization?.estado === 'RECHAZADO'
      ) {
        return parsed;
      }

      if (attempt < maxRetries - 1) {
        await this.sleep(delays[attempt] ?? 32_000);
      }
    }

    return {
      autorizaciones: [
        {
          estado: 'NO_AUTORIZADO',
          numeroAutorizacion: '',
          fechaAutorizacion: '',
          ambiente: this.getEnvironmentCode(),
          mensajes: [
            {
              identificador: '0',
              mensaje: 'Max polling retries exceeded',
              tipo: 'ERROR',
            },
          ],
        },
      ],
    };
  }

  async queryStatus(accessKey: string): Promise<SriAuthorizationResponse> {
    const client = await this.createClient(this.getAutorizacionUrl());
    const [result] = await this.callWithTimeout(
      client.autorizacionComprobantesOfflineAsync({
        claveAccesoComprobante: accessKey,
      }) as Promise<[unknown]>,
    );
    return this.parseAuthorizationResponse(result);
  }

  private createClient(url: string): Promise<soap.Client> {
    return createSoapClientAsync(url, { wsdl_options: { timeout: SOAP_TIMEOUT_MS } });
  }

  private callWithTimeout<T>(promise: Promise<T>): Promise<T> {
    const timeout = new Promise<never>((_, reject) =>
      setTimeout(
        () => reject(new Error(`SRI SOAP call timed out after ${SOAP_TIMEOUT_MS}ms`)),
        SOAP_TIMEOUT_MS,
      ),
    );
    return Promise.race([promise, timeout]);
  }

  private getRecepcionUrl(): string {
    return this.isTestEnvironment()
      ? 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl'
      : 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/RecepcionComprobantesOffline?wsdl';
  }

  private getAutorizacionUrl(): string {
    return this.isTestEnvironment()
      ? 'https://celcer.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl'
      : 'https://cel.sri.gob.ec/comprobantes-electronicos-ws/AutorizacionComprobantesOffline?wsdl';
  }

  private getEnvironmentCode(): string {
    return this.isTestEnvironment() ? '1' : '2';
  }

  private isTestEnvironment(): boolean {
    return this.configService.get<string>('SRI_TEST_ENVIRONMENT') === 'true';
  }

  private parseReceptionResponse(result: unknown): SriReceptionResponse {
    if (typeof result !== 'object' || result === null) {
      return { estado: 'NO_PROCESADA' };
    }

    const response = result as SriReceptionResponse;
    return {
      estado: this.normalizeEstado(response.estado),
      comprobantes: Array.isArray(response.comprobantes)
        ? response.comprobantes.map((comprobante) => ({
            claveAcceso: String(comprobante.claveAcceso ?? ''),
            mensajes: this.normalizeMessages(comprobante.mensajes),
          }))
        : undefined,
    };
  }

  private parseAuthorizationResponse(
    result: unknown,
  ): SriAuthorizationResponse {
    if (typeof result !== 'object' || result === null) {
      return {};
    }

    const response = result as SriAuthorizationResponse;
    return {
      autorizaciones: Array.isArray(response.autorizaciones)
        ? response.autorizaciones.map((auth) => ({
            estado: this.normalizeEstado(auth.estado),
            numeroAutorizacion: String(auth.numeroAutorizacion ?? ''),
            fechaAutorizacion: String(auth.fechaAutorizacion ?? ''),
            ambiente: String(auth.ambiente ?? this.getEnvironmentCode()),
            comprobante:
              auth.comprobante != null ? String(auth.comprobante) : undefined,
            mensajes: this.normalizeMessages(auth.mensajes),
          }))
        : undefined,
    };
  }

  private normalizeEstado(value: unknown): string {
    if (typeof value !== 'string') return 'NO_PROCESADA';
    const normalized = value.trim().toUpperCase();

    const knownStates = new Set([
      'RECIBIDA',
      'DEVUELTA',
      'NO_PROCESADA',
      'AUTORIZADO',
      'RECHAZADO',
      'NO_AUTORIZADO',
    ]);

    return knownStates.has(normalized) ? normalized : 'NO_PROCESADA';
  }

  private normalizeMessages(
    mensajes: unknown,
  ): Array<{ identificador: string; mensaje: string; tipo: string }> | undefined {
    if (!mensajes) return undefined;

    const rawList = Array.isArray(mensajes) ? mensajes : [mensajes];

    const messages = rawList
      .flatMap((item: Record<string, unknown>) => {
        const nested = item.mensaje;
        if (
          nested &&
          typeof nested === 'object' &&
          !Array.isArray(nested) &&
          (nested as Record<string, unknown>).identificador !== undefined
        ) {
          return [this.buildMessage(nested as Record<string, unknown>)];
        }
        if (Array.isArray(nested)) {
          return nested.map((sub: Record<string, unknown>) =>
            this.buildMessage(sub),
          );
        }
        return [this.buildMessage(item)];
      })
      .filter((m) => m.mensaje.length > 0);

    return messages.length > 0 ? messages : undefined;
  }

  private buildMessage(
    item: Record<string, unknown> | string,
  ): { identificador: string; mensaje: string; tipo: string } {
    if (typeof item === 'string') {
      return { identificador: '0', mensaje: item, tipo: 'ERROR' };
    }

    const mensajeText =
      typeof item.mensaje === 'string'
        ? item.mensaje
        : String(item.text ?? '');

    return {
      identificador: String(item.identificador ?? item.id ?? '0'),
      mensaje: mensajeText,
      tipo: String(item.tipo ?? 'ERROR').toUpperCase(),
    };
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
