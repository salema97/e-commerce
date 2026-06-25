import { describe, it, expect, beforeAll } from 'vitest';
import forge from 'node-forge';
import { SriSignerService } from './sri-signer.service.js';

const TEST_PASSWORD = 'test-password';

function createTestP12(password: string): Buffer {
  const keys = forge.pki.rsa.generateKeyPair(2048);
  const cert = forge.pki.createCertificate();
  cert.publicKey = keys.publicKey;
  cert.serialNumber = '01';
  cert.validity.notBefore = new Date();
  cert.validity.notAfter = new Date();
  cert.validity.notAfter.setFullYear(
    cert.validity.notBefore.getFullYear() + 1,
  );
  cert.setSubject([{ name: 'commonName', value: 'SRI Test' }]);
  cert.setIssuer([{ name: 'commonName', value: 'SRI Test' }]);
  cert.sign(keys.privateKey, forge.md.sha256.create());

  const p12Asn1 = forge.pkcs12.toPkcs12Asn1(
    keys.privateKey,
    cert,
    password,
  );
  const p12Der = forge.asn1.toDer(p12Asn1).getBytes();
  return Buffer.from(p12Der, 'binary');
}

const sampleXml = `<?xml version="1.0" encoding="UTF-8"?>
<factura id="comprobante" version="2.1.0">
  <infoTributaria>
    <ambiente>1</ambiente>
  </infoTributaria>
</factura>`;

describe('SriSignerService', () => {
  let service: SriSignerService;
  let p12Buffer: Buffer;

  beforeAll(() => {
    service = new SriSignerService();
    p12Buffer = createTestP12(TEST_PASSWORD);
  });

  it('loads a .p12 and exposes the certificate and private key', () => {
    const { certificate, privateKey } = service.loadP12(p12Buffer, TEST_PASSWORD);

    expect(certificate).toBeDefined();
    expect(privateKey).toBeDefined();
    expect(service.getCertificate()).toBe(certificate);
    expect(service.getPrivateKey()).toBe(privateKey);
  });

  it('throws when the .p12 password is wrong', () => {
    expect(() => service.loadP12(p12Buffer, 'wrong-password')).toThrow(
      'SRI certificate is not loadable',
    );
  });

  it('signs XML with a valid XAdES-EPES enveloped signature', () => {
    const signedXml = service.sign(sampleXml, p12Buffer, TEST_PASSWORD);

    expect(signedXml).toContain('<ds:Signature');
    expect(signedXml).toContain('<ds:SignedInfo');
    expect(signedXml).toContain('<ds:SignatureValue');
    expect(signedXml).toContain('<ds:KeyInfo');
    expect(signedXml).toContain('<ds:X509Certificate');
    expect(signedXml).toContain('xmlns:xades="http://uri.etsi.org/01903/v1.3.2#"');
    expect(signedXml).toContain('<xades:QualifyingProperties');
    expect(signedXml).toContain('<xades:SignedProperties');
    expect(signedXml).toContain('<xades:SigningTime');
    expect(signedXml).toContain('<xades:SigningCertificate');
    expect(signedXml).toContain('<xades:SignaturePolicyIdentifier');
    expect(signedXml).toContain('<xades:SignaturePolicyImplied');
  });

  it('uses SRI-compatible algorithms in the signature', () => {
    const signedXml = service.sign(sampleXml, p12Buffer, TEST_PASSWORD);

    expect(signedXml).toContain(
      'Algorithm="http://www.w3.org/TR/2001/REC-xml-c14n-20010315"',
    );
    expect(signedXml).toContain(
      'Algorithm="http://www.w3.org/2000/09/xmldsig#rsa-sha256"',
    );
    expect(signedXml).toContain(
      'Algorithm="http://www.w3.org/2000/09/xmldsig#sha256"',
    );
    expect(signedXml).toContain(
      'Algorithm="http://www.w3.org/2000/09/xmldsig#enveloped-signature"',
    );
  });

  it('includes a SignedProperties reference with the XAdES type', () => {
    const signedXml = service.sign(sampleXml, p12Buffer, TEST_PASSWORD);

    expect(signedXml).toContain(
      'Type="http://uri.etsi.org/01903#SignedProperties"',
    );
    expect(signedXml).toContain('<xades:CertDigest>');
    expect(signedXml).toContain('<ds:DigestMethod');
    expect(signedXml).toContain('<xades:IssuerSerial>');
    expect(signedXml).toContain('<ds:X509IssuerName>');
    expect(signedXml).toContain('<ds:X509SerialNumber>');
  });

  it('verifies the signed XML against the embedded certificate', () => {
    const signedXml = service.sign(sampleXml, p12Buffer, TEST_PASSWORD);

    expect(service.verify(signedXml)).toBe(true);
  });

  it('rejects XML with a tampered SignedProperties element', () => {
    const signedXml = service.sign(sampleXml, p12Buffer, TEST_PASSWORD);
    const tamperedXml = signedXml.replace(
      /<xades:SigningTime>[^<]+<\/xades:SigningTime>/,
      '<xades:SigningTime>2000-01-01T00:00:00.000Z</xades:SigningTime>',
    );

    expect(service.verify(tamperedXml)).toBe(false);
  });
});
