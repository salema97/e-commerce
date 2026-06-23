import { describe, it, expect, beforeEach } from 'vitest';
import { SriCreditNoteXmlBuilder } from './sri-credit-note-xml.builder.js';
import { CreditNoteInput } from '../invoice-provider.interface.js';

describe('SriCreditNoteXmlBuilder', () => {
  let builder: SriCreditNoteXmlBuilder;

  beforeEach(() => {
    builder = new SriCreditNoteXmlBuilder();
  });

  const creditNote: CreditNoteInput = {
    returnRequestId: 'return_1',
    invoiceAccessKey: '1501202401017921467390011001001001000000001000000001',
    authorizationNumber: '1234567890',
    codDocModificado: '01',
    numDocModificado: '1501202401017921467390011001001001000000001000000001',
    fechaEmisionDocumentoModificado: '15/01/2024',
    reason: 'Customer return',
    items: [
      {
        code: 'SKU-001',
        description: 'Test product',
        quantity: 1,
        unitPrice: 100,
        discount: 0,
        taxRate: 15,
        reason: 'Customer return',
      },
    ],
    total: 115,
  };

  it('generates XML containing the access key and notaCredito root', () => {
    const xml = builder.buildNotaDeCredito({
      accessKey: '1501202401017921467390011001001001000000001000000001',
      customerName: 'John Doe',
      customerIdentification: '1710034065001',
      customerEmail: 'john@example.com',
      creditNote,
      establishmentCode: '001',
      emissionPointCode: '001',
      sequenceNumber: '000000001',
      environment: '1',
      companyRuc: '1792146739001',
      companyName: 'Test Company',
    });

    expect(xml).toContain('<?xml version="1.0" encoding="UTF-8"?>');
    expect(xml).toContain('<notaCredito');
    expect(xml).toContain('version="2.3.2"');
    expect(xml).toContain('1501202401017921467390011001001001000000001000000001');
    expect(xml).toContain('<codDoc>04</codDoc>');
  });

  it('includes infoNotaCredito referencing the original factura', () => {
    const xml = builder.buildNotaDeCredito({
      accessKey: '1501202401017921467390011001001001000000001000000001',
      customerName: 'John Doe',
      customerIdentification: '1710034065001',
      customerEmail: 'john@example.com',
      creditNote,
      establishmentCode: '001',
      emissionPointCode: '001',
      sequenceNumber: '000000001',
      environment: '1',
      companyRuc: '1792146739001',
      companyName: 'Test Company',
    });

    expect(xml).toContain('<codDocModificado>01</codDocModificado>');
    expect(xml).toContain(
      '<numDocModificado>1501202401017921467390011001001001000000001000000001</numDocModificado>',
    );
    expect(xml).toContain('<fechaEmisionDocumentoModificado>15/01/2024</fechaEmisionDocumentoModificado>');
    expect(xml).toContain('<motivo>Customer return</motivo>');
    expect(xml).toContain('<valorModificacion>115.00</valorModificacion>');
  });

  it('includes return item details with taxes', () => {
    const xml = builder.buildNotaDeCredito({
      accessKey: '1501202401017921467390011001001001000000001000000001',
      customerName: 'John Doe',
      customerIdentification: '1710034065001',
      customerEmail: 'john@example.com',
      creditNote,
      establishmentCode: '001',
      emissionPointCode: '001',
      sequenceNumber: '000000001',
      environment: '1',
      companyRuc: '1792146739001',
      companyName: 'Test Company',
    });

    expect(xml).toContain('<descripcion>Test product</descripcion>');
    expect(xml).toContain('<cantidad>1</cantidad>');
    expect(xml).toContain('<precioUnitario>100.00</precioUnitario>');
    expect(xml).toContain('<tarifa>15.00</tarifa>');
    expect(xml).toContain('<motivo>Customer return</motivo>');
  });

  it('detects RUC buyer identification type', () => {
    const xml = builder.buildNotaDeCredito({
      accessKey: '1501202401017921467390011001001001000000001000000001',
      customerName: 'John Doe',
      customerIdentification: '1710034065001',
      customerEmail: 'john@example.com',
      creditNote,
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
    const xml = builder.buildNotaDeCredito({
      accessKey: '1501202401017921467390011001001001000000001000000001',
      customerName: 'John Doe',
      customerIdentification: undefined,
      customerEmail: 'john@example.com',
      creditNote,
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
