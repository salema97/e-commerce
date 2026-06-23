import { Injectable, ConflictException, Logger } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service.js';

interface InvoiceSequenceRow {
  lastNumber: number;
  authorizedFrom: number;
  authorizedTo: number;
  nearExhaustionAlertSent: boolean;
}

@Injectable()
export class InvoiceSequenceService {
  private readonly logger = new Logger(InvoiceSequenceService.name);

  constructor(private readonly prisma: PrismaService) {}

  async allocateNext(
    documentType: string,
    establishmentCode: string,
    emissionPointCode: string,
  ): Promise<string> {
    const type = documentType.padStart(2, '0');
    const establishment = establishmentCode.padStart(3, '0');
    const emissionPoint = emissionPointCode.padStart(3, '0');

    const sequenceNumber = await this.prisma.$transaction(async (tx) => {
      const rows = await tx.$queryRawUnsafe<InvoiceSequenceRow[]>(
        `UPDATE "InvoiceSequence"
         SET "lastNumber" = GREATEST("lastNumber", "authorizedFrom" - 1) + 1
         WHERE "documentType" = $1
           AND "establishmentCode" = $2
           AND "emissionPointCode" = $3
           AND GREATEST("lastNumber", "authorizedFrom" - 1) + 1 <= "authorizedTo"
         RETURNING "lastNumber", "authorizedFrom", "authorizedTo", "nearExhaustionAlertSent"`,
        type,
        establishment,
        emissionPoint,
      );

      if (!rows || rows.length === 0) {
        throw new ConflictException(
          `Invoice sequence exhausted or not configured for ${type}-${establishment}-${emissionPoint}`,
        );
      }

      const row = rows[0];
      const remaining = row.authorizedTo - row.lastNumber;

      if (remaining < 100 && !row.nearExhaustionAlertSent) {
        await tx.$queryRawUnsafe<
          unknown
        >(
          `UPDATE "InvoiceSequence"
           SET "nearExhaustionAlertSent" = true
           WHERE "documentType" = $1
             AND "establishmentCode" = $2
             AND "emissionPointCode" = $3`,
          type,
          establishment,
          emissionPoint,
        );

        this.logger.warn(
          {
            documentType: type,
            establishmentCode: establishment,
            emissionPointCode: emissionPoint,
            remaining,
            authorizedTo: row.authorizedTo,
          },
          `Invoice sequence is near exhaustion (${remaining} numbers remaining)`,
        );
      }

      return String(row.lastNumber).padStart(9, '0');
    });

    return sequenceNumber;
  }
}
