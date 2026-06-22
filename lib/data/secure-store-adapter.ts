// SecureStore-backed storage adapter for the Supabase auth client (issue #6).
//
// Supabase persists the session (access + refresh token) through a storage
// interface. SecureStore keeps it in the platform keystore/keychain rather than
// plain AsyncStorage (constitution: privacy-aligned, secrets not in the clear).
//
// SecureStore caps a single value at 2048 bytes; a Supabase session can exceed
// that, so values are chunked: the entry under `key` holds the chunk count and
// each chunk lives under `key.<n>`. On web SecureStore is unavailable, so we
// fall back to localStorage (the `expo start --web` smoke path only).
//
// Never logs values — they are session tokens.
import { Platform } from 'react-native';
import * as SecureStore from 'expo-secure-store';
import type { SupportedStorage } from '@supabase/supabase-js';

const MAX_CHUNK_SIZE = 2000;

const countKey = (key: string): string => `${key}.chunks`;
const chunkKey = (key: string, index: number): string => `${key}.${index}`;

const webStorage: SupportedStorage = {
  getItem: (key) => globalThis.localStorage.getItem(key),
  setItem: (key, value) => globalThis.localStorage.setItem(key, value),
  removeItem: (key) => globalThis.localStorage.removeItem(key),
};

const readChunkCount = async (key: string): Promise<number> => {
  const raw = await SecureStore.getItemAsync(countKey(key));
  if (raw === null) return 0;
  const parsed = Number.parseInt(raw, 10);
  return Number.isNaN(parsed) ? 0 : parsed;
};

const removeChunks = async (key: string, count: number): Promise<void> => {
  const deletions: Promise<void>[] = [SecureStore.deleteItemAsync(countKey(key))];
  for (let i = 0; i < count; i += 1) {
    deletions.push(SecureStore.deleteItemAsync(chunkKey(key, i)));
  }
  await Promise.all(deletions);
};

const getItem = async (key: string): Promise<string | null> => {
  const count = await readChunkCount(key);
  if (count === 0) return null;
  const parts: string[] = [];
  for (let i = 0; i < count; i += 1) {
    const part = await SecureStore.getItemAsync(chunkKey(key, i));
    if (part === null) return null;
    parts.push(part);
  }
  return parts.join('');
};

const setItem = async (key: string, value: string): Promise<void> => {
  const previous = await readChunkCount(key);
  const chunks: string[] = [];
  for (let offset = 0; offset < value.length; offset += MAX_CHUNK_SIZE) {
    chunks.push(value.slice(offset, offset + MAX_CHUNK_SIZE));
  }
  for (let i = 0; i < chunks.length; i += 1) {
    await SecureStore.setItemAsync(chunkKey(key, i), chunks[i] as string);
  }
  for (let i = chunks.length; i < previous; i += 1) {
    await SecureStore.deleteItemAsync(chunkKey(key, i));
  }
  await SecureStore.setItemAsync(countKey(key), String(chunks.length));
};

const removeItem = async (key: string): Promise<void> => {
  const count = await readChunkCount(key);
  await removeChunks(key, count);
};

const nativeStorage: SupportedStorage = { getItem, setItem, removeItem };

// SecureStore is not available on web; localStorage backs the web smoke path.
export const secureStoreAdapter: SupportedStorage =
  Platform.OS === 'web' ? webStorage : nativeStorage;
