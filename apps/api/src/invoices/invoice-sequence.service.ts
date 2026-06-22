import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

@Injectable()
export class InvoiceSequenceService {
  constructor(private readonly prisma: PrismaService) {}

  async allocateNext(
    documentType: string,
    establishmentCode: string,
    emissionPointCode: string,
  ): Promise<string> {
    const type = documentType.padStart(2, '0');
    const establishment = establishmentCode.padStart(3, '0');
    const emissionPoint = emissionPointCode.padStart(3, '0');

    const rows = await this.prisma.$queryRawUnsafe<
      Array<{ currentNumber: number }>
    >(
      `UPDATE "InvoiceSequence"
       SET "currentNumber" = "currentNumber" + 1
       WHERE "documentType" = $1
         AND "establishmentCode" = $2
         AND "emissionPointCode" = $3
         AND "currentNumber" + 1 <= "endNumber"
       RETURNING "currentNumber"`,
      type,
      establishment,
      emissionPoint,
    );

    if (!rows || rows.length === 0) {
      throw new ConflictException(
        `Invoice sequence exhausted or not configured for ${type}-${establishment}-${emissionPoint}`,
      );
    }

    return String(rows[0].currentNumber).padStart(9, '0');
  }
}
