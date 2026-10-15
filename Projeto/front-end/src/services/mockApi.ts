import { ApiError, type ApiClient, type AuthSession, type User } from './types';

const MOCK_TOKEN_PREFIX = 'mock.';

export const DEFAULT_MOCK_USER: User = {
  id: 'mock-user-1',
  name: 'Estudante Teste',
  email: 'estudante@ellp.dev',
};

interface GoogleIdTokenPayload {
  sub?: string;
  name?: string;
  email?: string;
  picture?: string;
}

function decodeBase64Url(value: string): string {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/');
  const binary = atob(base64.padEnd(Math.ceil(base64.length / 4) * 4, '='));
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

function encodeBase64Url(value: string): string {
  const binary = Array.from(new TextEncoder().encode(value), (byte) => String.fromCharCode(byte)).join('');
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function userFromGoogleToken(idToken: string): User | null {
  const payload = idToken.split('.')[1];
  if (!payload) return null;

  try {
    const claims = JSON.parse(decodeBase64Url(payload)) as GoogleIdTokenPayload;
    if (!claims.email) return null;
    return {
      id: claims.sub ?? claims.email,
      name: claims.name ?? claims.email,
      email: claims.email,
      avatarUrl: claims.picture,
    };
  } catch {
    return null;
  }
}

function createMockToken(user: User): string {
  return MOCK_TOKEN_PREFIX + encodeBase64Url(JSON.stringify(user));
}

function userFromMockToken(token: string): User | null {
  if (!token.startsWith(MOCK_TOKEN_PREFIX)) return null;
  try {
    return JSON.parse(decodeBase64Url(token.slice(MOCK_TOKEN_PREFIX.length))) as User;
  } catch {
    return null;
  }
}

export const mockApi: ApiClient = {
  async loginWithGoogle(idToken: string): Promise<AuthSession> {
    if (!idToken) throw new ApiError(400, 'Token do Google ausente.');
    const user = userFromGoogleToken(idToken) ?? DEFAULT_MOCK_USER;
    return { token: createMockToken(user), user };
  },

  async getCurrentUser(token: string): Promise<User> {
    const user = userFromMockToken(token);
    if (!user) throw new ApiError(401, 'Sessão inválida ou expirada.');
    return user;
  },

  async logout(): Promise<void> {},
};
