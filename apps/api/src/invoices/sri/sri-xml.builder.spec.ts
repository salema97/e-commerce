import { describe, it, expect, beforeEach } from 'vitest';
import { SriXmlBuilder } from './sri-xml.builder.js';
import { SriAccessKeyBuilder } from './sri-access-key.builder.js';
import { InvoiceOrder } from '../invoice-provider.interface.js';

describe('SriXmlBuilder', () => {
  let builder: SriXmlBuilder;

  beforeEach(() => {
    builder = new SriXmlBuilder(new SriAccessKeyBuilder());
  });

  const order: InvoiceOrder = {
    orderId: 'order_1',
    orderNumber: 'ORD-001',
    customerName: 'John Doe',
    customerIdentification: '1710034065001',
    customerEmail: 'john@example.com',
    customerPhone: '0999999999',
    subtotal: 100,
    taxAmount: 15,
    discountAmount: 0,
    total: 115,
    currency: 'USD',
    items: [
      {
        code: 'SKU-001',
        description: 'Test product',
        quantity: 1,
        unitPrice: 100,
        discount: 0,
        taxRate: 15,
      },
    ],
  };

  it('generates XML containing the access key', () => {
    const xml = builder.buildFactura({
      accessKey: '1501202401017921467390011001001001000000001000000001',
      order,
      establishmentCode: '001',
      emissionPointCode: '001',
      sequenceNumber: '000000001',
      environment: '1',
      companyRuc: '1792146739001',
      companyName: 'Test Company',
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<factura');
    expect(xml).toContain('version="2.3.2"');
    expect(xml).toContain('1501202401017921467390011001001001000000001000000001');
  });

  it('includes order totals and item details', () => {
    const xml = builder.buildFactura({
      accessKey: '1501202401017921467390011001001001000000001000000001',
      order,
      establishmentCode: '001',
      emissionPointCode: '001',
      sequenceNumber: '000000001',
      environment: '1',
      companyRuc: '1792146739001',
      companyName: 'Test Company',
    });

    expect(xml).toContain('<importeTotal>115.00</importeTotal>');
    expect(xml).toContain('<descripcion>Test product</descripcion>');
    expect(xml).toContain('<cantidad>1</cantidad>');
  });

  it('detects RUC buyer identification type', () => {
    const xml = builder.buildFactura({
      accessKey: '1501202401017921467390011001001001000000001000000001',
      order,
      establishmentCode: '001',
      emissionPointCode: '001',
      sequenceNumber: '000000001',
      environment: '1',
      companyRuc: '1792146739001',
      companyName: 'Test Company',
    });

    expect(xml).toContain('<tipoIdentificacionComprador>04</tipoIdentificacionComprador>');
  });

  it('uses 13-digit consumidor final identification when buyer identification is missing', () => {
    const xml = builder.buildFactura({
      accessKey: '1501202401017921467390011001001001000000001000000001',
      order: { ...order, customerIdentification: undefined },
      establishmentCode: '001',
      emissionPointCode: '001',
      sequenceNumber: '000000001',
      environment: '1',
      companyRuc: '1792146739001',
      companyName: 'Test Company',
    });

    expect(xml).toContain('<tipoIdentificacionComprador>07</tipoIdentificacionComprador>');
    expect(xml).toContain('<identificacionComprador>9999999999999</identificacionComprador>');
  });
});
