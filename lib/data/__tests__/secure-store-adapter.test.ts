/// <reference types="jest" />
// Verifies the SecureStore adapter round-trips values larger than the 2048-byte
// SecureStore limit by chunking, and cleans up stale chunks when a value shrinks.
import * as SecureStore from 'expo-secure-store';

import { secureStoreAdapter } from '../secure-store-adapter';

jest.mock('expo-secure-store', () => {
  const store = new Map<string, string>();
  return {
    getItemAsync: jest.fn((key: string) =>
      Promise.resolve(store.has(key) ? store.get(key) : null),
    ),
    setItemAsync: jest.fn((key: string, value: string) => {
      store.set(key, value);
      return Promise.resolve();
    }),
    deleteItemAsync: jest.fn((key: string) => {
      store.delete(key);
      return Promise.resolve();
    }),
    __store: store,
  };
});

type MockedSecureStore = typeof SecureStore & { __store: Map<string, string> };
const mocked = SecureStore as MockedSecureStore;

beforeEach(() => {
  mocked.__store.clear();
  jest.clearAllMocks();
});

describe('secureStoreAdapter', () => {
  it('round-trips a value larger than the 2048-byte chunk limit', async () => {
    const big = 'a'.repeat(5000);
    await secureStoreAdapter.setItem('session', big);

    expect(mocked.__store.size).toBeGreaterThan(2);
    await expect(secureStoreAdapter.getItem('session')).resolves.toBe(big);
  });

  it('returns null for an unknown key', async () => {
    await expect(secureStoreAdapter.getItem('missing')).resolves.toBeNull();
  });

  it('drops stale chunks when a value shrinks', async () => {
    await secureStoreAdapter.setItem('session', 'b'.repeat(5000));
    await secureStoreAdapter.setItem('session', 'short');

    await expect(secureStoreAdapter.getItem('session')).resolves.toBe('short');
  });

  it('removes every chunk on removeItem', async () => {
    await secureStoreAdapter.setItem('session', 'c'.repeat(5000));
    await secureStoreAdapter.removeItem('session');

    expect(mocked.__store.size).toBe(0);
    await expect(secureStoreAdapter.getItem('session')).resolves.toBeNull();
  });
});
