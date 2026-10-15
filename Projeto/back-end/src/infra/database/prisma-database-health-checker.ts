import type { DatabaseHealthChecker } from '../../domain/repositories.js';
import type { AppPrismaClient } from './prisma.js';

export class PrismaDatabaseHealthChecker implements DatabaseHealthChecker {
  constructor(private readonly prisma: AppPrismaClient) {}

  async check(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
