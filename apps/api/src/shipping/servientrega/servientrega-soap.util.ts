import { promisify } from 'node:util';
import * as soap from 'soap';

const SOAP_TIMEOUT_MS = 30_000;

type SoapCreateClient = (
  url: string,
  options: { wsdl_options: { timeout: number } },
  callback: (err: Error | null, client: soap.Client) => void,
) => void;

const createSoapClientAsync = promisify(soap.createClient as SoapCreateClient);

export async function createServientregaSoapClient(wsdlUrl: string): Promise<soap.Client> {
  return createSoapClientAsync(wsdlUrl, { wsdl_options: { timeout: SOAP_TIMEOUT_MS } });
}

export async function callSoapMethodWithTimeout<T>(
  promise: Promise<T>,
  timeoutMs = SOAP_TIMEOUT_MS,
): Promise<T> {
  const timeout = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error(`Servientrega SOAP call timed out after ${timeoutMs}ms`)), timeoutMs),
  );
  return Promise.race([promise, timeout]);
}

export function extractGuideNumbers(payload: unknown): string[] {
  const numbers = new Set<string>();

  const visit = (node: unknown) => {
    if (node === null || node === undefined) return;
    if (Array.isArray(node)) {
      node.forEach(visit);
      return;
    }
    if (typeof node !== 'object') return;

    const record = node as Record<string, unknown>;
    for (const [key, value] of Object.entries(record)) {
      const normalizedKey = key.toLowerCase();
      if (
        (normalizedKey.includes('guia') || normalizedKey.includes('guide')) &&
        (typeof value === 'string' || typeof value === 'number')
      ) {
        const text = String(value).trim();
        if (/^\d{6,}$/.test(text)) {
          numbers.add(text);
        }
      }
      visit(value);
    }
  };

  visit(payload);
  return [...numbers];
}
