import { Injectable, OnModuleInit, OnModuleDestroy, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';

export function createAuditLogImmutabilityExtension() {
  const throwImmutable = async () => {
    throw new Error(
      'AuditLog records are immutable and can only be created through AuditLogService.log()',
    );
  };

  return {
    query: {
      auditLog: {
        update: throwImmutable,
        updateMany: throwImmutable,
        upsert: throwImmutable,
        delete: throwImmutable,
        deleteMany: throwImmutable,
      },
    },
  };
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  constructor(@Inject(ConfigService) configService: ConfigService) {
    const pool = new pg.Pool({
      connectionString: configService.getOrThrow<string>('DATABASE_URL'),
    });

    super({ adapter: new PrismaPg(pool) });

    const protectedClient = this.$extends(
      createAuditLogImmutabilityExtension() as never,
    );
    Object.defineProperty(this, 'auditLog', {
      configurable: true,
      enumerable: true,
      get: () => protectedClient.auditLog,
    });
  }

  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
  }
}
