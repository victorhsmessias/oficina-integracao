import { randomUUID } from 'node:crypto';

import { afterAll, beforeAll, describe, expect, it } from 'vitest';

import { PrismaDatabaseHealthChecker } from '../src/infra/database/prisma-database-health-checker.js';
import { PrismaProjectRepository } from '../src/infra/database/prisma-project-repository.js';
import { PrismaUserRepository } from '../src/infra/database/prisma-user-repository.js';
import { createPrismaClient } from '../src/infra/database/prisma.js';

const databaseUrl = process.env.TEST_DATABASE_URL;
const integrationSuite = describe.skipIf(!databaseUrl);

integrationSuite('integração com PostgreSQL real', () => {
  const prisma = createPrismaClient(databaseUrl!);
  const users = new PrismaUserRepository(prisma);
  const projects = new PrismaProjectRepository(prisma);
  const googleId = `integration-${randomUUID()}`;
  const email = `${googleId}@example.test`;
  let userId = '';

  beforeAll(async () => {
    await prisma.$connect();
  });

  afterAll(async () => {
    if (userId) {
      await prisma.user.deleteMany({ where: { id: userId } });
    }
    await prisma.$disconnect();
  });

  it('consulta a disponibilidade do banco', async () => {
    await expect(new PrismaDatabaseHealthChecker(prisma).check()).resolves.toBeUndefined();
  });

  it('persiste usuário Google e executa o ciclo completo de projetos', async () => {
    const user = await users.upsertGoogleUser({
      googleId,
      email,
      name: 'Usuário de integração'
    });
    userId = user.id;

    const created = await projects.create(user.id, {
      name: 'Projeto PostgreSQL',
      workspace: { blocks: { languageVersion: 0, blocks: [] } },
      schemaVersion: 1
    });
    expect(created.workspace).toEqual({ blocks: { languageVersion: 0, blocks: [] } });

    await expect(projects.listByUser(user.id)).resolves.toHaveLength(1);
    await expect(projects.findOwnedById(randomUUID(), created.id)).resolves.toBeNull();

    const updated = await projects.updateOwnedById(user.id, created.id, {
      name: 'Projeto atualizado'
    });
    expect(updated?.name).toBe('Projeto atualizado');

    await expect(projects.deleteOwnedById(user.id, created.id)).resolves.toBe(true);
    await expect(projects.findOwnedById(user.id, created.id)).resolves.toBeNull();
  });
});
