import 'dotenv/config';
import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { SriSignerService } from '../src/invoices/sri/sri-signer.service.js';
import { SriSoapClient } from '../src/invoices/sri/sri-soap.client.js';
import { SriXmlBuilder } from '../src/invoices/sri/sri-xml.builder.js';
import { SriAccessKeyBuilder } from '../src/invoices/sri/sri-access-key.builder.js';
import {
  mapSriCompanyToXmlFields,
  createEnvConfigReader,
  readSriCompanyConfig,
} from '../src/invoices/sri/sri-company.config.js';

const sampleOrder = {
  orderId: 'smoke-order',
  orderNumber: 'ORD-SMOKE-001',
  customerName: 'Cliente Smoke',
  customerIdentification: '1710034065001',
  customerEmail: 'cliente@example.com',
  subtotal: 100,
  taxAmount: 15,
  discountAmount: 0,
  total: 115,
  currency: 'USD',
  items: [
    {
      code: 'SKU-SMOKE',
      description: 'Producto smoke test',
      quantity: 1,
      unitPrice: 100,
      discount: 0,
      taxRate: 15,
      taxAmount: 15,
    },
  ],
};

async function main(): Promise<void> {
  const config = createEnvConfigReader(process.env);
  const company = readSriCompanyConfig(config);
  const certPath = resolve(
    process.cwd(),
    config.getOrThrow<string>('SRI_DIGITAL_CERTIFICATE_PATH'),
  );
  const password = config.getOrThrow<string>('SRI_DIGITAL_CERTIFICATE_PASSWORD');
  const ruc = company.ruc;

  console.log('=== SRI dev smoke test ===\n');

  // nestjs-doctor-ignore — standalone dev script; Nest DI is not bootstrapped here.
  const signer = new SriSignerService();
  const certBuffer = await readFile(certPath);
  const { certificate } = signer.loadP12(certBuffer, password);
  const subject = signer.describeCertificateSubject(certificate);
  const testEnv = config.get<string>('SRI_TEST_ENVIRONMENT') !== 'false';
  console.log(
    `[1/4] Certificado .p12 OK — titular: ${subject.commonName ?? '(sin CN)'}`,
  );
  if (subject.taxIds.length > 0) {
    console.log(`      IDs en sujeto: ${subject.taxIds.join(', ')}`);
  }
  const envRuc = ruc.trim();
  if (!subject.taxIds.includes(envRuc) && subject.commonName !== envRuc) {
    console.warn(
      `      AVISO: SRI_RUC (${envRuc}) no coincide con IDs del certificado; verifica .env antes de producción.`,
    );
  }
  console.log(`      Ambiente SRI: ${testEnv ? 'PRUEBAS (celcer)' : 'PRODUCCIÓN (cel)'}`);

  const accessKeyBuilder = new SriAccessKeyBuilder();
  const xmlBuilder = new SriXmlBuilder();
  const establishment = config.getOrThrow<string>('SRI_ESTABLISHMENT_CODE').trim();
  const emission = config.getOrThrow<string>('SRI_EMISSION_POINT_CODE').trim();
  const sequence = String(Math.floor(Math.random() * 900_000) + 100_000).padStart(9, '0');
  const emissionDate = new Date();
  const accessKey = accessKeyBuilder.build({
    date: emissionDate,
    documentType: '01',
    ruc: ruc.trim(),
    environment: '1',
    establishmentCode: establishment,
    emissionPointCode: emission,
    sequenceNumber: sequence,
  });

  const xml = xmlBuilder.buildFactura({
    accessKey,
    order: sampleOrder,
    establishmentCode: establishment,
    emissionPointCode: emission,
    sequenceNumber: sequence,
    environment: '1',
    emissionDate,
    ...mapSriCompanyToXmlFields(company),
  });
  console.log('[2/4] XML factura generado OK');

  const signedXml = signer.sign(xml, certBuffer, password);
  if (!signedXml.includes('<ds:Signature')) {
    throw new Error('XML firmado sin bloque ds:Signature');
  }
  console.log('[3/4] Firma XAdES OK');

  const soap = new SriSoapClient(config);
  const reception = await soap.submit(signedXml);
  console.log('[4/4] SOAP recepción SRI (celcer):', reception.estado);
  if (reception.comprobantes?.[0]?.mensajes?.length) {
    for (const msg of reception.comprobantes[0].mensajes) {
      console.log(`      → [${msg.tipo}] ${msg.identificador}: ${msg.mensaje}`);
    }
  }

  if (reception.estado === 'RECIBIDA') {
    const auth = await soap.poll(accessKey);
    const first = auth.autorizaciones?.[0];
    console.log('      Autorización:', first?.estado ?? 'sin respuesta');
    if (first?.mensajes?.length) {
      for (const msg of first.mensajes) {
        console.log(`      → [${msg.tipo}] ${msg.identificador}: ${msg.mensaje}`);
      }
    }
    if (first?.estado === 'NO_AUTORIZADO') {
      const last = await soap.queryStatus(accessKey);
      const pending = last.autorizaciones?.[0];
      if (pending && pending.estado !== first.estado) {
        console.log('      Última consulta SRI:', pending.estado);
        for (const msg of pending.mensajes ?? []) {
          console.log(`      → [${msg.tipo}] ${msg.identificador}: ${msg.mensaje}`);
        }
      }
    }
    if (first?.estado !== 'AUTORIZADO') {
      process.exitCode = 1;
    }
  } else {
    process.exitCode = 1;
  }

  console.log('\nSmoke test completado.');
}

main().catch((error: unknown) => {
  console.error('\nSmoke test FALLÓ:', error);
  process.exit(1);
});
