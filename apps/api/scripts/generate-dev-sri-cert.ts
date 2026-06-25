import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import forge from 'node-forge';

const RUC = process.env.DEV_SRI_RUC ?? '0591764479001';
const PASSWORD = process.env.DEV_SRI_CERT_PASSWORD ?? 'DevSriCert0591!';
const OUT_DIR = join(dirname(fileURLToPath(import.meta.url)), '../certs');
const OUT_FILE = join(OUT_DIR, 'dev-sri.p12');

function generateDevP12(): void {
  mkdirSync(OUT_DIR, { recursive: true });

  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();

  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(cert.validity.notBefore.getFullYear() + 10);

  const subject = [
    { name: 'countryName', value: 'EC' },
    { name: 'organizationName', value: 'E-commerce Dev' },
    { shortName: 'CN', value: RUC },
    { name: 'serialNumber', value: RUC },
  ];

  cert.setSubject(subject);
  cert.setIssuer(subject);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(keys.privateKey, cert, PASSWORD);
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();

  writeFileSync(OUT_FILE, Buffer.from(p12Der, 'binary'), { mode: 0o600 });

  const parsed = forge.pkcs12.pkcs12FromAsn1(p12Asn1, false, PASSWORD);
  const exportedCert = parsed.getBags({ bagType: forge.pki.oids.certBag })[
    forge.pki.oids.certBag
  ]?.[0]?.cert;
  const cn = exportedCert?.subject.getField('CN')?.value;

  // eslint-disable-next-line no-console
  console.log(`Dev SRI certificate written to ${OUT_FILE}`);
  // eslint-disable-next-line no-console
  console.log(`RUC (CN): ${cn ?? RUC}`);
  // eslint-disable-next-line no-console
  console.log('Password: set DEV_SRI_CERT_PASSWORD or use DevSriCert0591! in .env');
  // eslint-disable-next-line no-console
  console.log(
    'Note: self-signed dev cert signs XML locally; SRI will only authorize CA-issued test certificates.',
  );
}

generateDevP12();
