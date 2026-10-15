import { describe, expect, it } from 'vitest';

import { ProjectService } from '../src/services/project-service.js';
import { FakeProjectRepository, userFixture } from './fakes.js';

describe('ProjectService', () => {
  it('retorna 404 ao ler, atualizar ou excluir projeto não pertencente ao usuário', async () => {
    const service = new ProjectService(new FakeProjectRepository());
    const id = '22222222-2222-4222-8222-222222222222';

    await expect(service.get(userFixture.id, id)).rejects.toMatchObject({ statusCode: 404 });
    await expect(service.update(userFixture.id, id, { name: 'Novo' })).rejects.toMatchObject({
      statusCode: 404
    });
    await expect(service.delete(userFixture.id, id)).rejects.toMatchObject({ statusCode: 404 });
  });
});
