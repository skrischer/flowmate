/// <reference types="jest" />
// Verifies the first-run onboarding gate: the device-local completion flag
// round-trips through SecureStore, and resolveOnboardingNeeded applies the spec
// precedence (own logs -> skip; else active follower edge -> skip; else the flag
// decides). It must never read a role flag (there is none) — only counts.

import * as SecureStore from 'expo-secure-store';

import {
  getOnboardingComplete,
  resolveOnboardingNeeded,
  resolveShell,
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

const mockGetSession = jest.fn();
const mockPeriodsHead = jest.fn<Promise<CountResult>, []>();
const mockPairingHead = jest.fn<Promise<CountResult>, []>();

jest.mock('../client', () => ({
  supabase: {
    auth: { getSession: () => mockGetSession() },
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
  mockGetSession.mockResolvedValue({ data: { session: { user: { id: FOLLOWER } } }, error: null });
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

describe('resolveShell (owner-vs-follower routing)', () => {
  it('routes to the Flower shell when the account has own logs', async () => {
    mockPeriodsHead.mockResolvedValue({ count: 2, error: null });
    await expect(resolveShell()).resolves.toBe('flower');
  });

  it('routes to the Mate shell for an active follower with no own logs', async () => {
    mockPeriodsHead.mockResolvedValue({ count: 0, error: null });
    mockPairingHead.mockResolvedValue({ count: 1, error: null });
    await expect(resolveShell()).resolves.toBe('mate');
  });

  it('routes a both-owner-and-follower account to the Flower shell (own logs win)', async () => {
    mockPeriodsHead.mockResolvedValue({ count: 1, error: null });
    mockPairingHead.mockResolvedValue({ count: 1, error: null });
    await expect(resolveShell()).resolves.toBe('flower');
  });

  it('defaults to the Flower shell for a stateless account', async () => {
    await expect(resolveShell()).resolves.toBe('flower');
  });

  it('falls back to the Flower shell (no throw) when no session is restored', async () => {
    // Regression for #145: without a session the follower-edge check returns false
    // early -- it must not throw and must not consult the pairing table.
    mockGetSession.mockResolvedValue({ data: { session: null }, error: null });
    mockPairingHead.mockResolvedValue({ count: 1, error: null });
    await expect(resolveShell()).resolves.toBe('flower');
    expect(mockPairingHead).not.toHaveBeenCalled();
  });
});
