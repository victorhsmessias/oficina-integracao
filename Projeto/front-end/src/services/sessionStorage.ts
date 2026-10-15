import type { AuthSession } from './types';

export interface SessionStore {
  load(): AuthSession | null;
  save(session: AuthSession): void;
  clear(): void;
}

const STORAGE_KEY = 'ellp.session';

function isAuthSession(value: unknown): value is AuthSession {
  if (typeof value !== 'object' || value === null) return false;
  const session = value as Partial<AuthSession>;
  return typeof session.token === 'string' && typeof session.user === 'object' && session.user !== null;
}

export function createLocalSessionStore(storage: Storage = window.localStorage): SessionStore {
  return {
    load() {
      try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return null;
        const parsed: unknown = JSON.parse(raw);
        return isAuthSession(parsed) ? parsed : null;
      } catch {
        return null;
      }
    },
    save(session) {
      try {
        storage.setItem(STORAGE_KEY, JSON.stringify(session));
      } catch {}
    },
    clear() {
      try {
        storage.removeItem(STORAGE_KEY);
      } catch {}
    },
  };
}
