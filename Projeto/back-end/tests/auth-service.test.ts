import { describe, expect, it } from 'vitest';

import { AuthService } from '../src/services/auth-service.js';
import {
  FakeGoogleVerifier,
  FakeSessionProvider,
  FakeUserRepository,
  userFixture
} from './fakes.js';

describe('AuthService', () => {
  it('não devolve os campos internos do usuário', async () => {
    const users = new FakeUserRepository();
    const service = new AuthService(users, new FakeGoogleVerifier(), new FakeSessionProvider());
    const result = await service.loginWithGoogle('token');

    expect(result.user).toEqual({
      id: userFixture.id,
      name: 'Ana Souza',
      email: 'ana@gmail.com',
      avatarUrl: 'https://example.com/ana.png'
    });
    expect(result.user).not.toHaveProperty('googleId');
  });

  it('invalida a sessão quando o usuário não existe mais', async () => {
    const users = new FakeUserRepository();
    users.user = null;
    const service = new AuthService(users, new FakeGoogleVerifier(), new FakeSessionProvider());
    await expect(service.getCurrentUser(userFixture.id)).rejects.toMatchObject({
      statusCode: 401,
      message: 'Sessão inválida'
    });
  });
});
