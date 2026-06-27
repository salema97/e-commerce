import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type * as soap from 'soap';
import type { ServientregaTrackingSnapshot } from './servientrega-fulfillment.types.js';
import { callSoapMethodWithTimeout, createServientregaSoapClient } from './servientrega-soap.util.js';

@Injectable()
export class ServientregaTrackingSoapClient {
  constructor(private readonly config: ConfigService) {}

  getWsdlUrl(): string {
    return (
      this.config.get<string>('SERVIENTREGA_TRACKING_WSDL_URL') ??
      'http://sismilenio.servientrega.com/wsrastreoenvios/wsrastreoenvios.asmx?wsdl'
    );
  }

  async consultGuide(guideNumber: string): Promise<ServientregaTrackingSnapshot> {
    const client = await createServientregaSoapClient(this.getWsdlUrl());
    const method = this.resolveAsyncMethod(client, 'ConsultarGuia');
    const [result] = await callSoapMethodWithTimeout(
      method({ NumeroGuia: guideNumber }) as Promise<[unknown]>,
    );

    return mapTrackingSnapshot(guideNumber, result);
  }

  async fetchGuideImageBase64(guideNumber: string): Promise<string | null> {
    const client = await createServientregaSoapClient(this.getWsdlUrl());
    const method = this.resolveAsyncMethod(client, 'ImagenGuia');
    const [result] = await callSoapMethodWithTimeout(
      method({ strGuia: guideNumber }) as Promise<[unknown]>,
    );
    return extractImageBase64(result);
  }

  private resolveAsyncMethod(client: soap.Client, methodName: string) {
    const asyncName = `${methodName}Async`;
    const clientRecord = client as unknown as Record<string, unknown>;
    const method = clientRecord[asyncName];
    if (typeof method !== 'function') {
      throw new Error(`Servientrega tracking SOAP method ${asyncName} is not available`);
    }
    return method.bind(client) as (payload: unknown) => Promise<[unknown]>;
  }
}

function mapTrackingSnapshot(guideNumber: string, payload: unknown): ServientregaTrackingSnapshot {
  const flattened = flattenValues(payload).join(' ').toUpperCase();
  const isDelivered =
    flattened.includes('ENTREG') ||
    flattened.includes('DELIVERED') ||
    flattened.includes('RECIBIDO POR');

  return {
    guideNumber,
    statusText: flattened.slice(0, 240) || 'UNKNOWN',
    isDelivered,
    receivedBy: findField(payload, ['Recibido', 'recibido', 'RecibidoPor']),
    movementAt: findField(payload, ['FechaMovimiento', 'fechaMovimiento', 'Fecha_Entrega']),
    raw: payload,
  };
}

function flattenValues(node: unknown): string[] {
  if (node === null || node === undefined) return [];
  if (typeof node === 'string' || typeof node === 'number' || typeof node === 'boolean') {
    return [String(node)];
  }
  if (Array.isArray(node)) return node.flatMap(flattenValues);
  if (typeof node !== 'object') return [];
  return Object.values(node as Record<string, unknown>).flatMap(flattenValues);
}

function findField(node: unknown, keys: string[]): string | undefined {
  if (!node || typeof node !== 'object') return undefined;
  if (Array.isArray(node)) {
    for (const item of node) {
      const found = findField(item, keys);
      if (found) return found;
    }
    return undefined;
  }

  const record = node as Record<string, unknown>;
  for (const key of keys) {
    const value = record[key];
    if (typeof value === 'string' && value.trim()) return value.trim();
  }

  for (const value of Object.values(record)) {
    const found = findField(value, keys);
    if (found) return found;
  }
  return undefined;
}

function extractImageBase64(payload: unknown): string | null {
  const values = flattenValues(payload);
  const candidate = values.find((value) => value.length > 100);
  return candidate ?? null;
}
