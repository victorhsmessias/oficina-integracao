import { describe, expect, it } from 'vitest';
import { ApiError } from '../../services/api';
import { DEFAULT_MOCK_USER, mockApi } from '../../services/mockApi';

const base64Url = (value: string) =>
  btoa(String.fromCharCode(...new TextEncoder().encode(value)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');

const fakeGoogleToken = (claims: object) =>
  `${base64Url('{"alg":"RS256"}')}.${base64Url(JSON.stringify(claims))}.signature`;

describe('mockApi', () => {
  it('returns the default fake user for a development token', async () => {
    const session = await mockApi.loginWithGoogle('dev-mode-login');

    expect(session.user).toEqual(DEFAULT_MOCK_USER);
    expect(session.token).toEqual(expect.any(String));
  });

  it('uses the name and e-mail found in a Google credential', async () => {
    const token = fakeGoogleToken({
      sub: '123',
      name: 'João Ávila',
      email: 'joao@example.com',
      picture: 'https://example.com/a.png',
    });

    const { user } = await mockApi.loginWithGoogle(token);

    expect(user).toEqual({
      id: '123',
      name: 'João Ávila',
      email: 'joao@example.com',
      avatarUrl: 'https://example.com/a.png',
    });
  });

  it('falls back to the fake user when the credential has no e-mail or is malformed', async () => {
    await expect(mockApi.loginWithGoogle(fakeGoogleToken({ sub: '1' }))).resolves.toMatchObject({
      user: DEFAULT_MOCK_USER,
    });
    await expect(mockApi.loginWithGoogle('a.%%%.c')).resolves.toMatchObject({
      user: DEFAULT_MOCK_USER,
    });
  });

  it('rejects an empty token', async () => {
    await expect(mockApi.loginWithGoogle('')).rejects.toMatchObject({ status: 400 });
  });

  it('recovers the user from the session token', async () => {
    const session = await mockApi.loginWithGoogle(fakeGoogleToken({ email: 'maria@example.com' }));

    await expect(mockApi.getCurrentUser(session.token)).resolves.toEqual(session.user);
  });

  it('rejects unknown tokens with 401', async () => {
    const error = await mockApi.getCurrentUser('something-else').catch((e: unknown) => e);
    expect(error).toBeInstanceOf(ApiError);
    expect(error).toMatchObject({ status: 401 });

    await expect(mockApi.getCurrentUser('mock.%%%')).rejects.toMatchObject({ status: 401 });
  });

  it('logs out without errors', async () => {
    await expect(mockApi.logout('any')).resolves.toBeUndefined();
  });
});
