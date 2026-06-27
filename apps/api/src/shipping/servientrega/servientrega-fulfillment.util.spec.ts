import { describe, expect, it } from 'vitest';
import { extractGuideNumbers } from './servientrega-soap.util.js';
import { buildServientregaTrackingUrl } from './servientrega-order.util.js';
import { buildServientregaEnvioExterno } from './servientrega-guide.builder.js';

describe('servientrega soap utils', () => {
  it('extracts guide numbers from nested payload', () => {
    const numbers = extractGuideNumbers({
      envios: [{ Num_Guia: '912345678' }, { other: 123 }],
    });
    expect(numbers).toContain('912345678');
  });

  it('builds public tracking url', () => {
    const url = buildServientregaTrackingUrl('123456789');
    expect(url).toContain('guia=123456789');
    expect(url).toContain('tipo=GUIA');
  });

  it('builds envio externo from order', () => {
    const envio = buildServientregaEnvioExterno({
      order: {
        orderNumber: 'ORD-100',
        subtotal: 45.5,
        shippingAddress: {
          recipientName: 'Ana Pérez',
          street: 'Av. Amazonas 123',
          city: 'Quito',
          state: 'Pichincha',
          country: 'EC',
          phone: '0999999999',
        },
      },
      destinationCityId: 200,
      originCityId: 100,
      originContactName: 'Bodega',
      originStreet: 'Calle 1',
      originCityName: 'Quito',
    });

    expect(envio.Ide_CodigoCiudadDestino).toBe(200);
    expect(envio.Nom_Contacto).toBe('Ana Pérez');
    expect(envio.Num_ValorDeclaradoTotal).toBe(46);
  });
});
