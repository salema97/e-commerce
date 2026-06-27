import {
  Injectable,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import forge from 'node-forge';
import { DOMParser, XMLSerializer } from '@xmldom/xmldom';
import * as XmlDSigJs from 'xmldsigjs';
import crypto from 'node:crypto';
import { readFile } from 'node:fs/promises';

const DSIG_NAMESPACE = 'http://www.w3.org/2000/09/xmldsig#';
const XADES_NAMESPACE = 'http://uri.etsi.org/01903/v1.3.2#';
const XADES_SIGNED_PROPERTIES_TYPE = 'http://uri.etsi.org/01903#SignedProperties';
const C14N_ALGORITHM = 'http://www.w3.org/TR/2001/REC-xml-c14n-20010315';
const RSA_SHA256_ALGORITHM = 'http://www.w3.org/2000/09/xmldsig#rsa-sha256';
const SHA256_ALGORITHM = 'http://www.w3.org/2000/09/xmldsig#sha256';
const ENVELOPED_SIGNATURE_ALGORITHM =
  'http://www.w3.org/2000/09/xmldsig#enveloped-signature';

interface ParsedP12 {
  certificate: forge.pki.Certificate;
  privateKey: forge.pki.PrivateKey;
}

@Injectable()
export class SriSignerService {
  private readonly logger = new Logger(SriSignerService.name);
  private parsedP12: ParsedP12 | null = null;

  constructor() {
    if (typeof (globalThis as Record<string, unknown>).DOMParser === 'undefined') {
      (globalThis as unknown as { DOMParser: typeof DOMParser }).DOMParser = DOMParser;
    }
    XmlDSigJs.Application.setEngine('NodeCrypto', crypto as unknown as Crypto);
  }

  /**
   * Loads a .p12 file from disk or a data URI.
   *
   * Data URIs are useful in tests; production certificates are read from the
   * path configured in SRI_DIGITAL_CERTIFICATE_PATH.
   */
  async loadCertificateFileAsBuffer(path: string): Promise<Buffer> {
    if (path.startsWith('data:')) {
      const base64 = path.split(',')[1] ?? '';
      return Buffer.from(base64, 'base64');
    }
    return await readFile(path);
  }

  /**
   * Parses a .p12 buffer and returns the certificate and private key.
   */
  loadP12(
    p12Buffer: Buffer,
    password: string,
  ): ParsedP12 {
    try {
      const der = p12Buffer.toString('binary');
      const asn1 = forge.asn1.fromDer(der);
      const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, false, password);

      const certBagType = forge.pki.oids.certBag;
      const certBags = p12.getBags({ bagType: certBagType });
      const certificate = certBags[certBagType]?.[0]?.cert;
      if (!certificate) {
        throw new Error('No certificate found in .p12 file');
      }

      const keyBagType = forge.pki.oids.pkcs8ShroudedKeyBag;
      const keyBags = p12.getBags({ bagType: keyBagType });
      let privateKey = keyBags[keyBagType]?.[0]?.key;

      if (!privateKey) {
        const plainKeyBagType = forge.pki.oids.keyBag;
        const plainKeyBags = p12.getBags({ bagType: plainKeyBagType });
        privateKey = plainKeyBags[plainKeyBagType]?.[0]?.key;
      }

      if (!privateKey) {
        throw new Error('No private key found in .p12 file');
      }

      this.parsedP12 = { certificate, privateKey };
      return this.parsedP12;
    } catch (error) {
      this.logger.error({ error }, 'Failed to load SRI .p12 certificate');
      throw new BadRequestException(
        'SRI certificate is not loadable; check file and password',
      );
    }
  }

  getCertificate(): forge.pki.Certificate {
    if (!this.parsedP12) {
      throw new Error('Certificate not loaded; call loadP12 first');
    }
    return this.parsedP12.certificate;
  }

  getPrivateKey(): forge.pki.PrivateKey {
    if (!this.parsedP12) {
      throw new Error('Private key not loaded; call loadP12 first');
    }
    return this.parsedP12.privateKey;
  }

  /**
   * Describes the certificate subject for ops smoke tests.
   * Ecuador SRI certs usually put the holder name in CN; RUC/cedula may appear in other attributes.
   */
  describeCertificateSubject(certificate: forge.pki.Certificate): {
    commonName?: string;
    taxIds: string[];
  } {
    const taxIds: string[] = [];
    let commonName: string | undefined;

    for (const attr of certificate.subject.attributes) {
      const name = attr.shortName ?? attr.name;
      const value = String(attr.value ?? '');
      if (name === 'CN') {
        commonName = value;
      }
      for (const match of value.match(/\d{10,13}/g) ?? []) {
        if (match.length === 10 || match.length === 13) {
          taxIds.push(match);
        }
      }
    }

    return { commonName, taxIds: [...new Set(taxIds)] };
  }

  /**
   * Signs an XML document with the supplied .p12 digital certificate.
   *
   * The signature is an XAdES-EPES enveloped signature that is SRI-compatible:
   * RSA-SHA256, inclusive C14N, SHA-256 digest, X509Certificate KeyInfo, and
   * xades:QualifyingProperties with SigningTime, SigningCertificate, and
   * SignaturePolicyIdentifier/SignaturePolicyImplied.
   */
  sign(xml: string, p12Buffer: Buffer, password: string): string {
    const { certificate, privateKey } = this.loadP12(p12Buffer, password);

    const certPem = forge.pki.certificateToPem(certificate);
    const certBase64 = this.stripPemHeaders(certPem);
    const privateKeyPem = forge.pki.privateKeyToPem(privateKey);
    const signingKey = crypto.createPrivateKey(privateKeyPem);

    this.assertWellFormed(xml);

    const signatureId = this.generateSignatureId();
    const signedPropertiesId = `SignedProperties-${signatureId}`;
    const signingTime = new Date();

    const signedPropertiesXml = this.buildSignedProperties(
      certificate,
      signingTime,
      signedPropertiesId,
    );
    const signedPropertiesDigest = this.digestSignedProperties(signedPropertiesXml);
    const documentDigest = this.digestDocument(xml);

    const signedInfoXml = this.buildSignedInfo(
      documentDigest,
      signedPropertiesDigest,
      signedPropertiesId,
    );
    const signedInfoCanonical = this.canonicalize(signedInfoXml);
    const signatureValue = crypto
      .sign('RSA-SHA256', Buffer.from(signedInfoCanonical, 'utf8'), signingKey)
      .toString('base64');

    const xadesObjectXml = this.buildXadesObject(
      signatureId,
      signedPropertiesXml,
    );

    const signatureXml = this.buildSignature(
      signatureId,
      signedInfoXml,
      signatureValue,
      certBase64,
      xadesObjectXml,
    );

    return this.appendSignature(xml, signatureXml);
  }

  /**
   * Verifies that the XAdES-EPES signature in a signed document validates
   * against the X.509 certificate embedded in the KeyInfo element.
   *
   * Validation checks:
   * - SignedInfo signature value verifies with the certificate public key.
   * - The SignedProperties reference digest matches the canonical SignedProperties.
   * - The embedded certificate digest matches the SigningCertificate CertDigest.
   */
  verify(signedXml: string): boolean {
    const doc = this.parseXml(signedXml);
    const signatureElement = this.findElement(doc, 'Signature');
    const signedInfo = this.findElement(signatureElement ?? doc, 'SignedInfo');
    const signatureValue = this.findElementText(doc, 'SignatureValue');
    const certBase64 = this.findElementText(doc, 'X509Certificate');

    if (!signatureElement || !signedInfo || !signatureValue || !certBase64) {
      return false;
    }

    try {
      const certPem = this.wrapBase64Cert(certBase64);
      const publicKey = crypto.createPublicKey(certPem);

      const signedInfoCanonical = this.canonicalizeNode(signedInfo);
      const signatureValid = crypto.verify(
        'RSA-SHA256',
        Buffer.from(signedInfoCanonical, 'utf8'),
        publicKey,
        Buffer.from(signatureValue, 'base64'),
      );

      if (!signatureValid) {
        return false;
      }

      const signedPropertiesValid = this.verifySignedPropertiesReference(
        doc,
        signedInfo,
      );
      if (!signedPropertiesValid) {
        return false;
      }

      const certDigestValid = this.verifySigningCertificateDigest(
        doc,
        certBase64,
      );
      if (!certDigestValid) {
        return false;
      }

      return this.verifyDocumentReference(doc, signedInfo);
    } catch (error) {
      this.logger.warn({ error }, 'SRI XAdES-EPES signature verification failed');
      return false;
    }
  }

  private assertWellFormed(xml: string): void {
    const doc = this.parseXml(xml);
    if (!doc.documentElement) {
      throw new BadRequestException('Input XML is not well-formed');
    }
  }

  private parseXml(xml: string) {
    return new DOMParser().parseFromString(xml, 'application/xml');
  }

  private findElement(
    doc: ReturnType<DOMParser['parseFromString']> | Element | null,
    localName: string,
    namespace: string = DSIG_NAMESPACE,
  ) {
    if (!doc) return null;
    const list = doc.getElementsByTagNameNS(namespace, localName);
    return list.length > 0 ? list.item(0) : null;
  }

  private findElementText(
    doc: ReturnType<DOMParser['parseFromString']> | Element,
    localName: string,
    namespace: string = DSIG_NAMESPACE,
  ): string | null {
    const element = this.findElement(doc, localName, namespace);
    return element?.textContent ?? null;
  }

  private digestDocument(xml: string): string {
    const canonical = this.canonicalize(xml);
    return this.sha256Base64(canonical);
  }

  private digestSignedProperties(signedPropertiesXml: string): string {
    const doc = this.parseXml(signedPropertiesXml);
    const canonical = this.canonicalizeNode(doc);
    return this.sha256Base64(canonical);
  }

  private canonicalize(xml: string): string {
    const doc = this.parseXml(xml);
    return this.canonicalizeNode(doc);
  }

  private canonicalizeNode(
    node: ReturnType<DOMParser['parseFromString']> | Element,
  ): string {
    const canonicalizer = new (
      XmlDSigJs as unknown as {
        XmlCanonicalizer: new (
          withComments: boolean,
          exclusiveC14N: boolean,
        ) => { Canonicalize: (n: unknown) => string };
      }
    ).XmlCanonicalizer(false, false);
    return canonicalizer.Canonicalize(
      node as unknown as Parameters<typeof canonicalizer.Canonicalize>[0],
    );
  }

  private sha256Base64(data: string): string {
    return crypto
      .createHash('sha256')
      .update(Buffer.from(data, 'utf8'))
      .digest('base64');
  }

  private buildSignedProperties(
    certificate: forge.pki.Certificate,
    signingTime: Date,
    signedPropertiesId: string,
  ): string {
    const certDer = this.getCertificateDer(certificate);
    const certDigest = crypto.createHash('sha256').update(certDer).digest('base64');
    const issuerName = this.getIssuerName(certificate);
    const serialNumber = this.getSerialNumberDecimal(certificate);

    const signingTimeIso = signingTime.toISOString();

    return `<xades:SignedProperties xmlns:xades="${XADES_NAMESPACE}" xmlns:ds="${DSIG_NAMESPACE}" Id="${signedPropertiesId}">
  <xades:SignedSignatureProperties>
    <xades:SigningTime>${signingTimeIso}</xades:SigningTime>
    <xades:SigningCertificate>
      <xades:Cert>
        <xades:CertDigest>
          <ds:DigestMethod Algorithm="${SHA256_ALGORITHM}"/>
          <ds:DigestValue>${certDigest}</ds:DigestValue>
        </xades:CertDigest>
        <xades:IssuerSerial>
          <ds:X509IssuerName>${this.escapeXml(issuerName)}</ds:X509IssuerName>
          <ds:X509SerialNumber>${serialNumber}</ds:X509SerialNumber>
        </xades:IssuerSerial>
      </xades:Cert>
    </xades:SigningCertificate>
    <xades:SignaturePolicyIdentifier>
      <xades:SignaturePolicyImplied/>
    </xades:SignaturePolicyIdentifier>
  </xades:SignedSignatureProperties>
</xades:SignedProperties>`;
  }

  private buildXadesObject(signatureId: string, signedPropertiesXml: string): string {
    return `<ds:Object>
  <xades:QualifyingProperties xmlns:xades="${XADES_NAMESPACE}" Target="#${signatureId}">
    ${signedPropertiesXml}
  </xades:QualifyingProperties>
</ds:Object>`;
  }

  private buildSignedInfo(
    documentDigest: string,
    signedPropertiesDigest: string,
    signedPropertiesId: string,
  ): string {
    return `<ds:SignedInfo xmlns:ds="${DSIG_NAMESPACE}">
  <ds:CanonicalizationMethod Algorithm="${C14N_ALGORITHM}"/>
  <ds:SignatureMethod Algorithm="${RSA_SHA256_ALGORITHM}"/>
  <ds:Reference URI="">
    <ds:Transforms>
      <ds:Transform Algorithm="${ENVELOPED_SIGNATURE_ALGORITHM}"/>
    </ds:Transforms>
    <ds:DigestMethod Algorithm="${SHA256_ALGORITHM}"/>
    <ds:DigestValue>${documentDigest}</ds:DigestValue>
  </ds:Reference>
  <ds:Reference URI="#${signedPropertiesId}" Type="${XADES_SIGNED_PROPERTIES_TYPE}">
    <ds:DigestMethod Algorithm="${SHA256_ALGORITHM}"/>
    <ds:DigestValue>${signedPropertiesDigest}</ds:DigestValue>
  </ds:Reference>
</ds:SignedInfo>`;
  }

  private buildSignature(
    signatureId: string,
    signedInfoXml: string,
    signatureValue: string,
    certBase64: string,
    xadesObjectXml: string,
  ): string {
    return `<ds:Signature xmlns:ds="${DSIG_NAMESPACE}" Id="${signatureId}">
${signedInfoXml}
  <ds:SignatureValue>${signatureValue}</ds:SignatureValue>
  <ds:KeyInfo>
    <ds:X509Data>
      <ds:X509Certificate>${certBase64}</ds:X509Certificate>
    </ds:X509Data>
  </ds:KeyInfo>
${xadesObjectXml}
</ds:Signature>`;
  }

  private appendSignature(xml: string, signatureXml: string): string {
    const doc = this.parseXml(xml);
    const rootName = doc.documentElement.nodeName;
    const declaration =
      xml.match(/<\?xml[^?]*\?>\s*/i)?.[0] ??
      '<?xml version="1.0" encoding="UTF-8"?>\n';
    const stripped = xml.replace(/<\?xml[^?]*\?>\s*/i, '');
    const closingTag = `</${rootName}>`;
    const closingIndex = stripped.lastIndexOf(closingTag);

    if (closingIndex === -1) {
      throw new BadRequestException('Could not locate root element closing tag');
    }

    const signed =
      stripped.slice(0, closingIndex) +
      signatureXml +
      '\n' +
      stripped.slice(closingIndex);
    return declaration + signed;
  }

  private verifySignedPropertiesReference(
    doc: ReturnType<DOMParser['parseFromString']>,
    signedInfo: Element,
  ): boolean {
    const references = signedInfo.getElementsByTagNameNS(DSIG_NAMESPACE, 'Reference');
    let signedPropertiesReference: Element | null = null;
    for (let i = 0; i < references.length; i++) {
      const ref = references.item(i);
      if (ref?.getAttribute('Type') === XADES_SIGNED_PROPERTIES_TYPE) {
        signedPropertiesReference = ref;
        break;
      }
    }

    if (!signedPropertiesReference) {
      return false;
    }

    const uri = signedPropertiesReference.getAttribute('URI') ?? '';
    const expectedId = uri.replace(/^#/, '');
    const expectedDigest = this.findElementText(
      signedPropertiesReference,
      'DigestValue',
    );

    if (!expectedDigest || !expectedId) {
      return false;
    }

    const signedPropertiesList = doc.getElementsByTagNameNS(
      XADES_NAMESPACE,
      'SignedProperties',
    );
    let signedProperties: Element | null = null;
    for (let i = 0; i < signedPropertiesList.length; i++) {
      const candidate = signedPropertiesList.item(i);
      if (candidate?.getAttribute('Id') === expectedId) {
        signedProperties = candidate;
        break;
      }
    }

    if (!signedProperties) {
      return false;
    }

    const canonical = this.canonicalizeNode(signedProperties);
    const actualDigest = this.sha256Base64(canonical);
    return actualDigest === expectedDigest;
  }

  private verifyDocumentReference(
    doc: ReturnType<DOMParser['parseFromString']>,
    signedInfo: Element,
  ): boolean {
    const references = signedInfo.getElementsByTagNameNS(DSIG_NAMESPACE, 'Reference');
    let documentReference: Element | null = null;
    for (let i = 0; i < references.length; i++) {
      const ref = references.item(i);
      const uri = ref?.getAttribute('URI') ?? '';
      const type = ref?.getAttribute('Type');
      if (uri === '' && type !== XADES_SIGNED_PROPERTIES_TYPE) {
        documentReference = ref;
        break;
      }
    }

    if (!documentReference) {
      return false;
    }

    const expectedDigest = this.findElementText(documentReference, 'DigestValue');
    if (!expectedDigest) {
      return false;
    }

    const unsignedDoc = this.removeSignatureElement(doc);
    if (!unsignedDoc) {
      return false;
    }

    const canonical = this.canonicalizeNode(unsignedDoc);
    const actualDigest = this.sha256Base64(canonical);
    return actualDigest === expectedDigest;
  }

  private verifySigningCertificateDigest(
    doc: ReturnType<DOMParser['parseFromString']>,
    certBase64: string,
  ): boolean {
    const certDer = Buffer.from(certBase64, 'base64');
    const expectedDigest = crypto
      .createHash('sha256')
      .update(certDer)
      .digest('base64');

    const certDigestElement = this.findElement(
      doc,
      'CertDigest',
      XADES_NAMESPACE,
    );
    if (!certDigestElement) {
      return false;
    }

    const actualDigest = this.findElementText(certDigestElement, 'DigestValue');
    return actualDigest === expectedDigest;
  }

  private removeSignatureElement(
    doc: ReturnType<DOMParser['parseFromString']>,
  ): ReturnType<DOMParser['parseFromString']> | null {
    const signature = this.findElement(doc, 'Signature');
    if (!signature) {
      return doc;
    }

    const serializer = new XMLSerializer();
    const xml = serializer.serializeToString(doc);
    const unsignedXml = xml.replace(
      /<(?:\w+:)?Signature\b[^>]*>[\s\S]*?<\/(?:\w+:)?Signature>\s*/g,
      '',
    );

    return new DOMParser().parseFromString(unsignedXml, 'text/xml');
  }

  private getCertificateDer(certificate: forge.pki.Certificate): Buffer {
    const asn1 = forge.pki.certificateToAsn1(certificate);
    const der = forge.asn1.toDer(asn1).getBytes();
    return Buffer.from(der, 'binary');
  }

  private getIssuerName(certificate: forge.pki.Certificate): string {
    const attrs = certificate.issuer.attributes;
    if (!attrs || attrs.length === 0) {
      return '';
    }
    const order = ['CN', 'OU', 'O', 'L', 'ST', 'C'];
    const sorted = [...attrs].sort((a, b) => {
      const aKey = a.shortName ?? a.name ?? '';
      const bKey = b.shortName ?? b.name ?? '';
      const aIndex = order.indexOf(aKey);
      const bIndex = order.indexOf(bKey);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
    return sorted
      .map((attr) => {
        const key = attr.shortName ?? attr.name ?? '';
        const value = this.escapeRdnValue(String(attr.value));
        return `${key}=${value}`;
      })
      .join(', ');
  }

  private escapeRdnValue(value: string): string {
    if (/^[a-zA-Z0-9]+$/.test(value)) {
      return value;
    }
    return value
      .replace(/\\/g, '\\\\')
      .replace(/"/g, '\\"')
      .replace(/,/g, '\\,');
  }

  private getSerialNumberDecimal(certificate: forge.pki.Certificate): string {
    const hex = certificate.serialNumber ?? '00';
    try {
      return BigInt(`0x${hex}`).toString(10);
    } catch {
      return parseInt(hex, 16).toString(10);
    }
  }

  private escapeXml(value: string): string {
    return value
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&apos;');
  }

  private generateSignatureId(): string {
    return `Signature-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 8)}`;
  }

  private stripPemHeaders(pem: string): string {
    return pem
      .replace(/-----(BEGIN|END) [A-Z ]+-----/g, '')
      .replace(/\s/g, '');
  }

  private wrapBase64Cert(base64: string): string {
    const body = base64.match(/.{1,64}/g)?.join('\n') ?? base64;
    return `-----BEGIN CERTIFICATE-----\n${body}\n-----END CERTIFICATE-----`;
  }
}
