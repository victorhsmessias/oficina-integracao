import { describe, expect, it } from 'vitest';

import { GoogleIdentityTokenVerifier } from '../src/infra/auth/google-token-verifier.js';

function clientWith(payload: Record<string, unknown> | undefined) {
  return {
    async verifyIdToken(options: { idToken: string; audience?: string | string[] }) {
      expect(options).toEqual({
        idToken: 'google-jwt',
        audience: 'client.apps.googleusercontent.com'
      });
      return { getPayload: () => payload } as never;
    }
  };
}

describe('GoogleIdentityTokenVerifier', () => {
  it('extrai o perfil somente depois de validar token e audience', async () => {
    const verifier = new GoogleIdentityTokenVerifier(
      'client.apps.googleusercontent.com',
      clientWith({
        sub: 'google-1',
        email: 'ana@gmail.com',
        email_verified: true,
        name: 'Ana Souza',
        picture: 'https://example.com/ana.png'
      })
    );

    await expect(verifier.verify('google-jwt')).resolves.toEqual({
      googleId: 'google-1',
      email: 'ana@gmail.com',
      name: 'Ana Souza',
      avatarUrl: 'https://example.com/ana.png'
    });
  });

  it('usa o início do e-mail quando o Google não retorna nome', async () => {
    const verifier = new GoogleIdentityTokenVerifier(
      'client.apps.googleusercontent.com',
      clientWith({ sub: 'google-1', email: 'ana@gmail.com', email_verified: true })
    );
    await expect(verifier.verify('google-jwt')).resolves.toMatchObject({ name: 'ana' });
  });

  it.each([
    undefined,
    { email: 'ana@gmail.com', email_verified: true },
    { sub: 'google-1', email: 'ana@gmail.com', email_verified: false }
  ])('rejeita payload incompleto ou e-mail não verificado', async (payload) => {
    const verifier = new GoogleIdentityTokenVerifier(
      'client.apps.googleusercontent.com',
      clientWith(payload)
    );
    await expect(verifier.verify('google-jwt')).rejects.toMatchObject({ statusCode: 401 });
  });

  it('traduz falhas da biblioteca do Google para 401', async () => {
    const verifier = new GoogleIdentityTokenVerifier('client.apps.googleusercontent.com', {
      async verifyIdToken() {
        throw new Error('assinatura inválida');
      }
    });
    await expect(verifier.verify('google-jwt')).rejects.toMatchObject({
      statusCode: 401,
      message: 'Token do Google inválido ou expirado'
    });
  });
});
