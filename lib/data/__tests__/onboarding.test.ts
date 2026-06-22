/// <reference types="jest" />
// Verifies the first-run onboarding gate: the device-local completion flag
// round-trips through SecureStore, and resolveOnboardingNeeded applies the spec
// precedence (own logs -> skip; else active follower edge -> skip; else the flag
// decides). It must never read a role flag (there is none) — only counts.

import * as SecureStore from 'expo-secure-store';

import {
  getOnboardingComplete,
  resolveOnboardingNeeded,
  setOnboardingComplete,
} from '../onboarding';

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
const mockedStore = SecureStore as MockedSecureStore;

type CountResult = { count: number | null; error: null };

interface PairingChain {
  eq: (column: string, value: string) => PairingChain;
  then: (resolve: (value: CountResult) => unknown) => Promise<unknown>;
}

const mockGetUser = jest.fn();
const mockPeriodsHead = jest.fn<Promise<CountResult>, []>();
const mockPairingHead = jest.fn<Promise<CountResult>, []>();

jest.mock('../client', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (table: string) => ({
      select: () => {
        if (table === 'periods') {
          return mockPeriodsHead();
        }
        const chain: PairingChain = {
          eq: () => chain,
          then: (resolve) => mockPairingHead().then(resolve),
        };
        return chain;
      },
    }),
  },
}));

const FOLLOWER = 'follower-uuid';

beforeEach(() => {
  jest.clearAllMocks();
  mockedStore.__store.clear();
  mockGetUser.mockResolvedValue({ data: { user: { id: FOLLOWER } }, error: null });
  mockPeriodsHead.mockResolvedValue({ count: 0, error: null });
  mockPairingHead.mockResolvedValue({ count: 0, error: null });
});

describe('onboarding completion flag', () => {
  it('starts unset and persists once marked complete', async () => {
    await expect(getOnboardingComplete()).resolves.toBe(false);
    await setOnboardingComplete();
    await expect(getOnboardingComplete()).resolves.toBe(true);
  });
});

describe('resolveOnboardingNeeded precedence', () => {
  it('shows the fork for a stateless, unflagged account', async () => {
    await expect(resolveOnboardingNeeded()).resolves.toBe(true);
  });

  it('skips the fork once the completion flag is set', async () => {
    await setOnboardingComplete();
    await expect(resolveOnboardingNeeded()).resolves.toBe(false);
  });

  it('skips the fork when the account has own logs (Flower precedence)', async () => {
    mockPeriodsHead.mockResolvedValue({ count: 2, error: null });
    await expect(resolveOnboardingNeeded()).resolves.toBe(false);
  });

  it('skips the fork when an active follower edge exists', async () => {
    mockPairingHead.mockResolvedValue({ count: 1, error: null });
    await expect(resolveOnboardingNeeded()).resolves.toBe(false);
  });
});
