import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

type AppEnv = {
  DATABASE_URL: string;
};

export default defineConfig({
  earlyAccess: true,
  schema: 'prisma/schema.prisma',
  migrations: {
    path: 'prisma/migrations',
  },
  datasource: {
    url: env<AppEnv>('DATABASE_URL'),
  },
});
