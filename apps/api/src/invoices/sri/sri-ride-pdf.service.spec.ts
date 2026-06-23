import { describe, it, expect } from 'vitest';
import { SriRidePdfService } from './sri-ride-pdf.service.js';

const fixtureInvoiceXml = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="2.3.2">
  <infoTributaria>
    <ambiente>1</ambiente>
    <tipoEmision>1</tipoEmision>
    <razonSocial>Mi Tienda S.A.</razonSocial>
    <nombreComercial>Mi Tienda</nombreComercial>
    <ruc>1792146739001</ruc>
    <claveAcceso>1234567890123456789012345678901234567890123456789</claveAcceso>
    <codDoc>01</codDoc>
    <estab>001</estab>
    <ptoEmi>001</ptoEmi>
    <secuencial>000000001</secuencial>
    <dirMatriz>Direccion matriz</dirMatriz>
  </infoTributaria>
  <infoFactura>
    <fechaEmision>15/01/2024</fechaEmision>
    <dirEstablecimiento>Direccion establecimiento</dirEstablecimiento>
    <obligadoContabilidad>SI</obligadoContabilidad>
    <tipoIdentificacionComprador>07</tipoIdentificacionComprador>
    <razonSocialComprador>Cliente Ejemplo</razonSocialComprador>
    <identificacionComprador>9999999999</identificacionComprador>
    <direccionComprador>Direccion comprador</direccionComprador>
    <totalSinImpuestos>100.00</totalSinImpuestos>
    <totalDescuento>0.00</totalDescuento>
    <totalConImpuestos>
      <totalImpuesto>
        <codigo>2</codigo>
        <codigoPorcentaje>4</codigoPorcentaje>
        <baseImponible>100.00</baseImponible>
        <valor>15.00</valor>
      </totalImpuesto>
    </totalConImpuestos>
    <propina>0.00</propina>
    <importeTotal>115.00</importeTotal>
    <moneda>DOLAR</moneda>
  </infoFactura>
  <detalles>
    <detalle>
      <codigoPrincipal>SKU-001</codigoPrincipal>
      <descripcion>Producto de prueba</descripcion>
      <cantidad>1</cantidad>
      <precioUnitario>100.00</precioUnitario>
      <descuento>0.00</descuento>
      <precioTotalSinImpuesto>100.00</precioTotalSinImpuesto>
      <impuestos>
        <impuesto>
          <codigo>2</codigo>
          <codigoPorcentaje>4</codigoPorcentaje>
          <tarifa>15</tarifa>
          <baseImponible>100.00</baseImponible>
          <valor>15.00</valor>
        </impuesto>
      </impuestos>
    </detalle>
  </detalles>
  <infoAdicional>
    <campoAdicional nombre="email">cliente@example.com</campoAdicional>
    <campoAdicional nombre="telefono">0999999999</campoAdicional>
  </infoAdicional>
</factura>`;

describe('SriRidePdfService', () => {
  const service = new SriRidePdfService();

  it('generates a non-empty PDF buffer from authorized invoice XML', async () => {
    const buffer = await service.generateFromAuthorizedXml(
      fixtureInvoiceXml,
      '1234567890',
      new Date('2024-01-15T00:00:00'),
    );

    expect(buffer).toBeInstanceOf(Buffer);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.toString('utf8', 0, 5)).toBe('%PDF-');
  });

  it('throws when XML is not a supported SRI document', async () => {
    await expect(
      service.generateFromAuthorizedXml('<root/>'),
    ).rejects.toThrow('Unsupported SRI XML document type');
  });
});
