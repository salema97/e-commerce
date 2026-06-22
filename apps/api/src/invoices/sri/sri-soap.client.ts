import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as soap from 'soap';
import { XMLParser } from 'fast-xml-parser';

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
    const [result] = await client.recepcionComprobantesOfflineAsync({ xml });
    return this.parseReceptionResponse(result);
  }

  async poll(accessKey: string): Promise<SriAuthorizationResponse> {
    const maxRetries = 5;
    const delays = [2_000, 4_000, 8_000, 16_000, 32_000];

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      const parsed = await this.queryStatus(accessKey);

      const authorization = parsed.autorizaciones?.[0];
      if (authorization?.estado === 'AUTORIZADO' || authorization?.estado === 'RECHAZADO') {
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
            { identificador: '0', mensaje: 'Max polling retries exceeded', tipo: 'ERROR' },
          ],
        },
      ],
    };
  }

  async queryStatus(accessKey: string): Promise<SriAuthorizationResponse> {
    const client = await this.createClient(this.getAutorizacionUrl());
    const [result] = await client.autorizacionComprobantesOfflineAsync({
      claveAccesoComprobante: accessKey,
    });
    const parsed = this.parseAuthorizationResponse(result);

    // TODO: The SRI web consultation URL and payload are not officially documented
    // and may change. This is a best-effort fallback when the direct SOAP service
    // returns no authorization payload.
    if (!parsed.autorizaciones?.length) {
      return this.consultarAutorizacionPorClaveAcceso(accessKey);
    }

    return parsed;
  }

  /**
   * Fallback web-scrape/SOAP hybrid consultation using the SRI SOL key.
   *
   * TODO: Validate the exact SRI web endpoint and request shape. The current
   * implementation performs an unauthenticated GET to the public verification
   * portal including the SOL key as a query parameter; this should be replaced
   * with the official flow once confirmed.
   */
  async consultarAutorizacionPorClaveAcceso(
    accessKey: string,
  ): Promise<SriAuthorizationResponse> {
    const solKey = this.configService.getOrThrow<string>('SRI_SOL_KEY');
    const baseUrl = this.getConsultaWebUrl();
    const url = `${baseUrl}?accion=validarComprobante&claveAcceso=${encodeURIComponent(
      accessKey,
    )}&solKey=${encodeURIComponent(solKey)}`;

    try {
      const response = await fetch(url, { method: 'GET' });
      const text = await response.text();
      return this.parseWebAuthorizationResponse(text);
    } catch (error) {
      this.logger.warn(
        { error, accessKey },
        'SRI web consultation fallback failed',
      );
      return {};
    }
  }

  private async createClient(url: string): Promise<soap.Client> {
    return new Promise((resolve, reject) => {
      soap.createClient(url, (err, client) => {
        if (err) reject(err);
        else resolve(client);
      });
    });
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

  private getConsultaWebUrl(): string {
    return this.isTestEnvironment()
      ? 'https://celcer.sri.gob.ec/comprobantes-electronicos-www/serviciosAdmin/verificacionComprobantes/validarComprobante.jsp'
      : 'https://cel.sri.gob.ec/comprobantes-electronicos-www/serviciosAdmin/verificacionComprobantes/validarComprobante.jsp';
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
      estado: response.estado ?? 'NO_PROCESADA',
      comprobantes: response.comprobantes,
    };
  }

  private parseAuthorizationResponse(result: unknown): SriAuthorizationResponse {
    if (typeof result !== 'object' || result === null) {
      return {};
    }
    return result as SriAuthorizationResponse;
  }

  private parseWebAuthorizationResponse(text: string): SriAuthorizationResponse {
    try {
      const parser = new XMLParser({
        ignoreAttributes: false,
        textNodeName: 'text',
      });
      const parsed = parser.parse(text);

      const rawAutorizaciones =
        parsed?.autorizacion ??
        parsed?.autorizaciones?.autorizacion ??
        parsed?.respuesta?.autorizaciones?.autorizacion;

      if (!rawAutorizaciones) {
        return {};
      }

      const list = Array.isArray(rawAutorizaciones)
        ? rawAutorizaciones
        : [rawAutorizaciones];

      return {
        autorizaciones: list.map((item: Record<string, unknown>) => ({
          estado: String(item.estado ?? 'NO_AUTORIZADO'),
          numeroAutorizacion: String(item.numeroAutorizacion ?? ''),
          fechaAutorizacion: String(item.fechaAutorizacion ?? ''),
          ambiente: String(item.ambiente ?? this.getEnvironmentCode()),
          comprobante:
            item.comprobante != null ? String(item.comprobante) : undefined,
          mensajes: this.parseWebMensajes(item.mensajes),
        })),
      };
    } catch (error) {
      this.logger.warn(
        { error },
        'Failed to parse SRI web consultation response',
      );
      return {};
    }
  }

  private parseWebMensajes(
    mensajes: unknown,
  ): Array<{ identificador: string; mensaje: string; tipo: string }> | undefined {
    if (!mensajes) return undefined;

    const list = Array.isArray(mensajes) ? mensajes : [mensajes];
    return list
      .flatMap((item: Record<string, unknown>) => {
        const wrapped = item.mensaje;
        if (wrapped) {
          return Array.isArray(wrapped) ? wrapped : [wrapped];
        }
        return [item];
      })
      .map((item: Record<string, unknown>) => ({
        identificador: String(item.identificador ?? item.id ?? '0'),
        mensaje: String(item.mensaje ?? item.text ?? ''),
        tipo: String(item.tipo ?? 'ERROR'),
      }))
      .filter((m) => m.mensaje.length > 0);
  }

  private sleep(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}
