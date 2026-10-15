import { beforeEach, describe, expect, it, vi } from 'vitest';

import { PrismaProjectRepository } from '../src/infra/database/prisma-project-repository.js';
import { PrismaDatabaseHealthChecker } from '../src/infra/database/prisma-database-health-checker.js';
import { PrismaUserRepository } from '../src/infra/database/prisma-user-repository.js';
import { userFixture } from './fakes.js';

const projectRow = {
  id: '22222222-2222-4222-8222-222222222222',
  name: 'Projeto',
  workspace: { blocks: {} },
  schemaVersion: 1,
  userId: userFixture.id,
  createdAt: new Date('2026-10-14T20:00:00.000Z'),
  updatedAt: new Date('2026-10-14T20:30:00.000Z')
};

describe('repositórios Prisma', () => {
  const prisma = {
    user: {
      upsert: vi.fn(),
      findUnique: vi.fn()
    },
    project: {
      findMany: vi.fn(),
      create: vi.fn(),
      findFirst: vi.fn(),
      updateMany: vi.fn(),
      deleteMany: vi.fn()
    },
    $queryRaw: vi.fn()
  };

  beforeEach(() => vi.clearAllMocks());

  it('cria/atualiza e localiza o usuário pelo Prisma', async () => {
    prisma.user.upsert.mockResolvedValue(userFixture);
    prisma.user.findUnique.mockResolvedValue(userFixture);
    const repository = new PrismaUserRepository(prisma as never);
    const profile = {
      googleId: 'google-123',
      name: 'Ana Souza',
      email: 'ana@gmail.com',
      avatarUrl: 'https://example.com/ana.png'
    };

    await expect(repository.upsertGoogleUser(profile)).resolves.toEqual(userFixture);
    expect(prisma.user.upsert).toHaveBeenCalledWith({
      where: { googleId: 'google-123' },
      create: profile,
      update: {
        name: profile.name,
        email: profile.email,
        avatarUrl: profile.avatarUrl
      }
    });
    await expect(repository.findById(userFixture.id)).resolves.toEqual(userFixture);
    expect(prisma.user.findUnique).toHaveBeenCalledWith({ where: { id: userFixture.id } });
  });

  it('verifica a conexão com o PostgreSQL', async () => {
    prisma.$queryRaw.mockResolvedValue([{ '?column?': 1 }]);
    await expect(
      new PrismaDatabaseHealthChecker(prisma as never).check()
    ).resolves.toBeUndefined();
    expect(prisma.$queryRaw).toHaveBeenCalledOnce();
  });

  it('lista e cria projetos convertendo o workspace JSON', async () => {
    prisma.project.findMany.mockResolvedValue([
      { id: projectRow.id, name: projectRow.name, updatedAt: projectRow.updatedAt }
    ]);
    prisma.project.create.mockResolvedValue(projectRow);
    const repository = new PrismaProjectRepository(prisma as never);

    await repository.listByUser(userFixture.id);
    expect(prisma.project.findMany).toHaveBeenCalledWith({
      where: { userId: userFixture.id },
      select: { id: true, name: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' }
    });

    await expect(
      repository.create(userFixture.id, {
        name: 'Projeto',
        workspace: { blocks: {} },
        schemaVersion: 1
      })
    ).resolves.toEqual(projectRow);
  });

  it('busca apenas projetos pertencentes ao usuário', async () => {
    const repository = new PrismaProjectRepository(prisma as never);
    prisma.project.findFirst.mockResolvedValueOnce(projectRow).mockResolvedValueOnce(null);

    await expect(repository.findOwnedById(userFixture.id, projectRow.id)).resolves.toEqual(
      projectRow
    );
    await expect(repository.findOwnedById(userFixture.id, 'ausente')).resolves.toBeNull();
  });

  it('atualiza campos presentes e retorna o registro atualizado', async () => {
    const repository = new PrismaProjectRepository(prisma as never);
    prisma.project.updateMany.mockResolvedValue({ count: 1 });
    prisma.project.findFirst.mockResolvedValue({ ...projectRow, name: 'Novo' });

    await expect(
      repository.updateOwnedById(userFixture.id, projectRow.id, {
        name: 'Novo',
        workspace: { blocks: { languageVersion: 0 } }
      })
    ).resolves.toMatchObject({ name: 'Novo' });
    expect(prisma.project.updateMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: projectRow.id, userId: userFixture.id },
        data: { name: 'Novo', workspace: { blocks: { languageVersion: 0 } } }
      })
    );
  });

  it('retorna null quando a atualização não encontra projeto ou ele some após a escrita', async () => {
    const repository = new PrismaProjectRepository(prisma as never);
    prisma.project.updateMany.mockResolvedValueOnce({ count: 0 }).mockResolvedValueOnce({ count: 1 });
    prisma.project.findFirst.mockResolvedValue(null);

    await expect(
      repository.updateOwnedById(userFixture.id, projectRow.id, { name: 'Novo' })
    ).resolves.toBeNull();
    await expect(
      repository.updateOwnedById(userFixture.id, projectRow.id, { workspace: {} })
    ).resolves.toBeNull();
  });

  it('informa se a exclusão encontrou um projeto do usuário', async () => {
    const repository = new PrismaProjectRepository(prisma as never);
    prisma.project.deleteMany.mockResolvedValueOnce({ count: 1 }).mockResolvedValueOnce({ count: 0 });

    await expect(repository.deleteOwnedById(userFixture.id, projectRow.id)).resolves.toBe(true);
    await expect(repository.deleteOwnedById(userFixture.id, 'ausente')).resolves.toBe(false);
  });
});
