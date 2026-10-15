import { vi } from 'vitest';
import type { ApiClient, AuthSession, User } from '../services/api';
import type { SessionStore } from '../services/sessionStorage';

export const testUser: User = { id: 'u1', name: 'Ana Souza', email: 'ana@example.com' };

export const testSession: AuthSession = { token: 'valid-token', user: testUser };

export function createFakeApi(overrides: Partial<ApiClient> = {}): ApiClient {
  return {
    loginWithGoogle: vi.fn(async () => testSession),
    getCurrentUser: vi.fn(async () => testUser),
    logout: vi.fn(async () => {}),
    ...overrides,
  };
}

export function createMemorySessionStore(initial: AuthSession | null = null): SessionStore {
  let stored = initial;
  return {
    load: vi.fn(() => stored),
    save: vi.fn((session: AuthSession) => {
      stored = session;
    }),
    clear: vi.fn(() => {
      stored = null;
    }),
  };
}
