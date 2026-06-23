import { randomInt } from 'node:crypto';

export interface AccessKeyInput {
  date: Date;
  documentType: string;
  ruc: string;
  environment: '1' | '2';
  establishmentCode: string;
  emissionPointCode: string;
  sequenceNumber: string;
  emissionType?: '1' | '2';
}

export class SriAccessKeyBuilder {
  build(input: AccessKeyInput): string {
    this.validate(input);

    const datePart = this.formatDate(input.date);
    const documentType = input.documentType.padStart(2, '0');
    const ruc = input.ruc.padStart(13, '0');
    const environment = input.environment;
    const establishment = input.establishmentCode.padStart(3, '0');
    const emissionPoint = input.emissionPointCode.padStart(3, '0');
    const sequence = input.sequenceNumber.padStart(9, '0');
    const numericCode = this.generateNumericCode();
    const emissionType = input.emissionType ?? '1';

    const base =
      datePart +
      documentType +
      ruc +
      environment +
      establishment +
      emissionPoint +
      sequence +
      numericCode +
      emissionType;

    const checkDigit = this.computeModulo11(base);
    return base + checkDigit;
  }

  private validate(input: AccessKeyInput): void {
    if (!(input.date instanceof Date) || Number.isNaN(input.date.getTime())) {
      throw new Error('Invalid date provided for access key');
    }

    if (!/^\d{1,2}$/.test(input.documentType)) {
      throw new Error('documentType must be a 1-2 digit numeric code');
    }

    if (!/^\d{13}$/.test(input.ruc)) {
      throw new Error('ruc must be a 13-digit numeric string');
    }

    if (input.environment !== '1' && input.environment !== '2') {
      throw new Error('environment must be "1" (test) or "2" (production)');
    }

    if (!/^\d{1,3}$/.test(input.establishmentCode)) {
      throw new Error('establishmentCode must be a 1-3 digit numeric code');
    }

    if (!/^\d{1,3}$/.test(input.emissionPointCode)) {
      throw new Error('emissionPointCode must be a 1-3 digit numeric code');
    }

    if (!/^\d{1,9}$/.test(input.sequenceNumber)) {
      throw new Error('sequenceNumber must be a 1-9 digit numeric code');
    }

    if (input.emissionType && input.emissionType !== '1' && input.emissionType !== '2') {
      throw new Error('emissionType must be "1" or "2"');
    }
  }

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return day + month + year;
  }

  private generateNumericCode(): string {
    return String(randomInt(0, 100_000_000)).padStart(8, '0');
  }

  computeModulo11(base: string): string {
    let factor = 2;
    let sum = 0;

    for (let i = base.length - 1; i >= 0; i--) {
      const digit = parseInt(base[i], 10);
      sum += digit * factor;
      factor = factor === 7 ? 2 : factor + 1;
    }

    const remainder = sum % 11;
    const checkDigit = 11 - remainder;

    if (checkDigit === 11) return '0';
    if (checkDigit === 10) return '1';
    return String(checkDigit);
  }
}
