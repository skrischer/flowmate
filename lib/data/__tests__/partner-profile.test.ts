/// <reference types="jest" />
// Verifies the READ-ONLY partner-profile path getPartnerProfile (issue #112):
// resolves the active pairing edge in EITHER direction (owner or follower role)
// to find the partner's id, then reads ONLY profiles.id + display_name -- never
// raw health data, never periods or daily_logs.

import { getPartnerProfile } from '../profiles';
import type { Tables } from '../database.types';

type PairingRow = Pick<Tables<'pairing'>, 'owner_id' | 'follower_id'>;
type ProfileRow = Pick<Tables<'profiles'>, 'id' | 'display_name'>;
type MaybeSingle<T> = { data: T | null; error: unknown };

const mockGetUser = jest.fn();
const mockPairingMaybeSingle = jest.fn<Promise<MaybeSingle<PairingRow>>, []>();
const mockProfileMaybeSingle = jest.fn<Promise<MaybeSingle<ProfileRow>>, []>();
const tablesQueried: string[] = [];
const orCalls: string[] = [];

interface Chain {
  eq: (column: string, value: string) => Chain;
  or: (filter: string) => Chain;
  maybeSingle: () => Promise<MaybeSingle<unknown>>;
  select: (columns: string) => Chain;
}

jest.mock('../client', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (table: string) => {
      tablesQueried.push(table);
      const resolver =
        table === 'pairing' ? mockPairingMaybeSingle : mockProfileMaybeSingle;
      const chain: Chain = {
        select: () => chain,
        eq: () => chain,
        or: (filter: string) => {
          orCalls.push(filter);
          return chain;
        },
        maybeSingle: () => resolver(),
      };
      return chain;
    },
  },
}));

const OWNER = 'owner-uuid';
const FOLLOWER = 'follower-uuid';

const activeEdge: PairingRow = { owner_id: OWNER, follower_id: FOLLOWER };

beforeEach(() => {
  jest.clearAllMocks();
  tablesQueried.length = 0;
  orCalls.length = 0;
  mockGetUser.mockResolvedValue({ data: { user: { id: FOLLOWER } }, error: null });
  mockPairingMaybeSingle.mockResolvedValue({ data: activeEdge, error: null });
  mockProfileMaybeSingle.mockResolvedValue({
    data: { id: OWNER, display_name: 'Alice' },
    error: null,
  });
});

describe('getPartnerProfile', () => {
  it('queries the pairing table then the profiles table', async () => {
    await getPartnerProfile();
    expect(tablesQueried).toEqual(['pairing', 'profiles']);
  });

  it('returns id and displayName (camelCase) for the partner', async () => {
    const result = await getPartnerProfile();
    expect(result).toEqual({ id: OWNER, displayName: 'Alice' });
  });

  it('resolves the partner as follower_id when caller is owner', async () => {
    mockGetUser.mockResolvedValue({ data: { user: { id: OWNER } }, error: null });
    mockProfileMaybeSingle.mockResolvedValue({
      data: { id: FOLLOWER, display_name: 'Bob' },
      error: null,
    });
    const result = await getPartnerProfile();
    expect(result).toEqual({ id: FOLLOWER, displayName: 'Bob' });
  });

  it('covers both edge directions in the OR filter', async () => {
    await getPartnerProfile();
    expect(orCalls.length).toBe(1);
    const filter = orCalls[0] ?? '';
    expect(filter).toContain('owner_id.eq.');
    expect(filter).toContain('follower_id.eq.');
  });

  it('returns null when there is no active edge', async () => {
    mockPairingMaybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(getPartnerProfile()).resolves.toBeNull();
    expect(tablesQueried).toEqual(['pairing']);
  });

  it('returns null when there is no session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(getPartnerProfile()).resolves.toBeNull();
    expect(tablesQueried).toEqual([]);
  });

  it('returns null when the partner profile row does not exist', async () => {
    mockProfileMaybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(getPartnerProfile()).resolves.toBeNull();
  });

  it('handles a null display_name gracefully', async () => {
    mockProfileMaybeSingle.mockResolvedValue({
      data: { id: OWNER, display_name: null },
      error: null,
    });
    const result = await getPartnerProfile();
    expect(result).toEqual({ id: OWNER, displayName: null });
  });

  it('never reads periods or daily_logs', async () => {
    await getPartnerProfile();
    expect(tablesQueried).not.toContain('periods');
    expect(tablesQueried).not.toContain('daily_logs');
  });

  it('throws when the pairing query errors', async () => {
    mockPairingMaybeSingle.mockResolvedValue({ data: null, error: new Error('db error') });
    await expect(getPartnerProfile()).rejects.toThrow('db error');
  });

  it('throws when the profile query errors', async () => {
    mockProfileMaybeSingle.mockResolvedValue({ data: null, error: new Error('rls denied') });
    await expect(getPartnerProfile()).rejects.toThrow('rls denied');
  });
});
