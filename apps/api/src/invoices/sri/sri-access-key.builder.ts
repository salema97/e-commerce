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

  private formatDate(date: Date): string {
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = String(date.getFullYear());
    return day + month + year;
  }

  private generateNumericCode(): string {
    return String(Math.floor(Math.random() * 100_000_000)).padStart(8, '0');
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
