import { describe, expect, it, vi } from 'vitest';
import { createLocalSessionStore } from '../../services/sessionStorage';
import { testSession } from '../helpers';

describe('createLocalSessionStore', () => {
  it('saves, loads and clears the session', () => {
    const store = createLocalSessionStore();

    expect(store.load()).toBeNull();
    store.save(testSession);
    expect(store.load()).toEqual(testSession);
    store.clear();
    expect(store.load()).toBeNull();
  });

  it('ignores corrupted or unexpected data', () => {
    const store = createLocalSessionStore();

    window.localStorage.setItem('ellp.session', '{not json');
    expect(store.load()).toBeNull();

    window.localStorage.setItem('ellp.session', JSON.stringify({ token: 1 }));
    expect(store.load()).toBeNull();
  });

  it('does not throw when the storage is unavailable', () => {
    const failingStorage = {
      getItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      setItem: vi.fn(() => {
        throw new Error('blocked');
      }),
      removeItem: vi.fn(() => {
        throw new Error('blocked');
      }),
    } as unknown as Storage;
    const store = createLocalSessionStore(failingStorage);

    expect(store.load()).toBeNull();
    expect(() => store.save(testSession)).not.toThrow();
    expect(() => store.clear()).not.toThrow();
  });
});
