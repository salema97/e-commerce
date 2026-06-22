declare module 'xmldsigjs' {
  export class XmlCanonicalizer {
    constructor(withComments: boolean, exclusiveC14N: boolean);
    Canonicalize(node: unknown): string;
  }

  export class SignedXml {
    Sign(
      algorithm: unknown,
      key: unknown,
      data: unknown,
      options?: unknown,
    ): Promise<unknown>;
    toString(): string;
  }

  export const Application: {
    setEngine(name: string, crypto: unknown): void;
  };

  export function Parse(xml: string): unknown;
  export function Select(xpath: string, node: unknown): unknown;
}
