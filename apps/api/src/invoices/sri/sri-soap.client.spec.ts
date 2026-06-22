import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { SriSoapClient } from './sri-soap.client.js';
import * as soap from 'soap';

vi.mock('soap', () => ({
  createClient: vi.fn(),
}));

function mockFetch(responseText: string, ok = true) {
  return vi.fn().mockResolvedValue({
    ok,
    text: () => Promise.resolve(responseText),
  });
}

function createClient(config?: Partial<Record<string, string>>) {
  const configService = new ConfigService({
    SRI_SOL_KEY: config?.SRI_SOL_KEY ?? 'sol-key',
    SRI_TEST_ENVIRONMENT: config?.SRI_TEST_ENVIRONMENT ?? 'true',
  });
  return new SriSoapClient(configService);
}

describe('SriSoapClient', () => {
  let createClientMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    createClientMock = vi.mocked(soap.createClient);
  });

  it('submits an XML and returns the reception response', async () => {
    const clientMock = {
      recepcionComprobantesOfflineAsync: vi
        .fn()
        .mockResolvedValue([{ estado: 'RECIBIDA' }]),
    };
    createClientMock.mockImplementation((_url, cb) =>
      cb(null, clientMock as never),
    );

    const sriClient = createClient();
    const result = await sriClient.submit('<xml/>');

    expect(result.estado).toBe('RECIBIDA');
    expect(createClientMock).toHaveBeenCalledWith(
      expect.stringContaining('RecepcionComprobantesOffline'),
      expect.any(Function),
    );
  });

  it('returns SOAP authorization when available', async () => {
    const clientMock = {
      autorizacionComprobantesOfflineAsync: vi.fn().mockResolvedValue([
        {
          autorizaciones: [
            {
              estado: 'AUTORIZADO',
              numeroAutorizacion: '123',
              fechaAutorizacion: '2024-01-01',
              ambiente: '1',
            },
          ],
        },
      ]),
    };
    createClientMock.mockImplementation((_url, cb) =>
      cb(null, clientMock as never),
    );

    const sriClient = createClient();
    const result = await sriClient.queryStatus('access-key');

    expect(result.autorizaciones?.[0].estado).toBe('AUTORIZADO');
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('falls back to web consultation when SOAP returns no authorization', async () => {
    const clientMock = {
      autorizacionComprobantesOfflineAsync: vi
        .fn()
        .mockResolvedValue([{}]),
    };
    createClientMock.mockImplementation((_url, cb) =>
      cb(null, clientMock as never),
    );

    globalThis.fetch = mockFetch(`
      <autorizacion>
        <estado>AUTORIZADO</estado>
        <numeroAutorizacion>456</numeroAutorizacion>
        <fechaAutorizacion>2024-02-02</fechaAutorizacion>
        <ambiente>1</ambiente>
      </autorizacion>
    `);

    const sriClient = createClient();
    const result = await sriClient.queryStatus('access-key');

    expect(globalThis.fetch).toHaveBeenCalledWith(
      expect.stringContaining('sol-key'),
      { method: 'GET' },
    );
    expect(result.autorizaciones?.[0]).toMatchObject({
      estado: 'AUTORIZADO',
      numeroAutorizacion: '456',
    });
  });

  it('consultarAutorizacionPorClaveAcceso parses a web XML response', async () => {
    globalThis.fetch = mockFetch(`
      <autorizaciones>
        <autorizacion>
          <estado>RECHAZADO</estado>
          <numeroAutorizacion></numeroAutorizacion>
          <fechaAutorizacion>2024-03-03</fechaAutorizacion>
          <ambiente>1</ambiente>
          <mensajes>
            <mensaje>
              <identificador>1</identificador>
              <mensaje>Error message</mensaje>
              <tipo>ERROR</tipo>
            </mensaje>
          </mensajes>
        </autorizacion>
      </autorizaciones>
    `);

    const sriClient = createClient();
    const result = await sriClient.consultarAutorizacionPorClaveAcceso('key');

    expect(result.autorizaciones?.[0]).toMatchObject({
      estado: 'RECHAZADO',
      mensajes: [{ identificador: '1', mensaje: 'Error message', tipo: 'ERROR' }],
    });
  });

  it('returns an empty response when web consultation fails', async () => {
    globalThis.fetch = vi.fn().mockRejectedValue(new Error('network error'));

    const sriClient = createClient();
    const result = await sriClient.consultarAutorizacionPorClaveAcceso('key');

    expect(result).toEqual({});
  });
});
