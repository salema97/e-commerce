import { describe, it, expect, beforeEach, vi } from 'vitest';
import { ConfigService } from '@nestjs/config';
import { SriSoapClient } from './sri-soap.client.js';
import * as soap from 'soap';

vi.mock('soap', () => ({
  createClient: vi.fn(),
}));

function createClient(config?: Partial<Record<string, string>>) {
  const configService = new ConfigService({
    SRI_TEST_ENVIRONMENT: config?.SRI_TEST_ENVIRONMENT ?? 'true',
  });
  return new SriSoapClient(configService);
}

describe('SriSoapClient', () => {
  let createClientMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    createClientMock = vi.mocked(soap.createClient);
  });

  it('submits an XML and returns the reception response', async () => {
    const clientMock = {
      recepcionComprobantesOfflineAsync: vi
        .fn()
        .mockResolvedValue([{ estado: 'RECIBIDA' }]),
    };
    createClientMock.mockImplementation((_url, _options, cb) =>
      cb(null, clientMock as never),
    );

    const sriClient = createClient();
    const result = await sriClient.submit('<xml/>');

    expect(result.estado).toBe('RECIBIDA');
    expect(createClientMock).toHaveBeenCalledWith(
      expect.stringContaining('RecepcionComprobantesOffline'),
      expect.objectContaining({ wsdl_options: expect.objectContaining({ timeout: 30000 }) }),
      expect.any(Function),
    );
  });

  it('normalizes reception error messages', async () => {
    const clientMock = {
      recepcionComprobantesOfflineAsync: vi.fn().mockResolvedValue([
        {
          estado: 'DEVUELTA',
          comprobantes: [
            {
              claveAcceso: '1234567890123456789012345678901234567890123456789',
              mensajes: [
                {
                  identificador: '43',
                  mensaje: 'RUC del receptor inválido',
                  tipo: 'ERROR',
                },
              ],
            },
          ],
        },
      ]),
    };
    createClientMock.mockImplementation((_url, _options, cb) =>
      cb(null, clientMock as never),
    );

    const sriClient = createClient();
    const result = await sriClient.submit('<xml/>');

    expect(result.estado).toBe('DEVUELTA');
    expect(result.comprobantes?.[0].mensajes).toEqual([
      {
        identificador: '43',
        mensaje: 'RUC del receptor inválido',
        tipo: 'ERROR',
      },
    ]);
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
    createClientMock.mockImplementation((_url, _options, cb) =>
      cb(null, clientMock as never),
    );

    const sriClient = createClient();
    const result = await sriClient.queryStatus('access-key');

    expect(result.autorizaciones?.[0].estado).toBe('AUTORIZADO');
  });

  it('normalizes unknown statuses to NO_PROCESADA', async () => {
    const clientMock = {
      autorizacionComprobantesOfflineAsync: vi
        .fn()
        .mockResolvedValue([{ autorizaciones: [{ estado: 'unrecognized' }] }]),
    };
    createClientMock.mockImplementation((_url, _options, cb) =>
      cb(null, clientMock as never),
    );

    const sriClient = createClient();
    const result = await sriClient.queryStatus('access-key');

    expect(result.autorizaciones?.[0].estado).toBe('NO_PROCESADA');
  });

  it('polls authorization until RECHAZADO', async () => {
    const clientMock = {
      autorizacionComprobantesOfflineAsync: vi.fn().mockResolvedValue([
        {
          autorizaciones: [
            {
              estado: 'RECHAZADO',
              numeroAutorizacion: '',
              fechaAutorizacion: '2024-01-01',
              ambiente: '1',
              mensajes: [
                {
                  identificador: '1',
                  mensaje: 'Invalid document',
                  tipo: 'ERROR',
                },
              ],
            },
          ],
        },
      ]),
    };
    createClientMock.mockImplementation((_url, _options, cb) =>
      cb(null, clientMock as never),
    );

    const sriClient = createClient();
    const result = await sriClient.poll('access-key');

    expect(result.autorizaciones?.[0]).toMatchObject({
      estado: 'RECHAZADO',
      mensajes: [
        { identificador: '1', mensaje: 'Invalid document', tipo: 'ERROR' },
      ],
    });
  });

  it('returns NO_AUTORIZADO when polling times out', async () => {
    const clientMock = {
      autorizacionComprobantesOfflineAsync: vi
        .fn()
        .mockResolvedValue([{ autorizaciones: [] }]),
    };
    createClientMock.mockImplementation((_url, _options, cb) =>
      cb(null, clientMock as never),
    );

    const sriClient = createClient();
    (sriClient as unknown as { sleep: () => Promise<void> }).sleep = vi
      .fn()
      .mockResolvedValue(undefined);

    const result = await sriClient.poll('access-key');

    expect(result.autorizaciones?.[0].estado).toBe('NO_AUTORIZADO');
    expect(result.autorizaciones?.[0].mensajes?.[0].mensaje).toBe(
      'Max polling retries exceeded',
    );
  });

  it('does not expose the SOL key in any URL', async () => {
    const clientMock = {
      recepcionComprobantesOfflineAsync: vi
        .fn()
        .mockResolvedValue([{ estado: 'RECIBIDA' }]),
    };
    createClientMock.mockImplementation((_url, _options, cb) =>
      cb(null, clientMock as never),
    );

    const sriClient = createClient();
    await sriClient.submit('<xml/>');

    const calls = createClientMock.mock.calls as Array<[string]>;
    for (const [url] of calls) {
      expect(url).not.toContain('solKey');
      expect(url).not.toContain('SOL');
    }
  });
});
