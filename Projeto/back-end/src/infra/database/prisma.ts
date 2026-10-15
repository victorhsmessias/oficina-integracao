import { PrismaClient } from '../../generated/prisma/client.js';

export function createPrismaClient(databaseUrl: string): PrismaClient {
  return new PrismaClient({ datasourceUrl: databaseUrl });
}

export type AppPrismaClient = ReturnType<typeof createPrismaClient>;
