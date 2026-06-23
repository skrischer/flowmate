/// <reference types="jest" />
// Verifies the READ-ONLY follower path getFollowedSharedState: it resolves the
// active pairing edge to the owner and reads ONLY that owner's shared_state row.
// It returns { connected: false } when there is no session or no active edge
// (revoked), and { connected: true, state } on an active edge -- with state null
// when the owner has not published a snapshot yet (connected but waiting), never
// conflating that with ended. It never touches periods or daily_logs.

import { getFollowedSharedState } from '../shared-state';
import type { Tables } from '../database.types';

type PairingRow = Pick<Tables<'pairing'>, 'owner_id'>;
type MaybeSingle<T> = { data: T | null; error: unknown };

const mockGetUser = jest.fn();
const mockPairingMaybeSingle = jest.fn<Promise<MaybeSingle<PairingRow>>, []>();
const mockSharedMaybeSingle = jest.fn<Promise<MaybeSingle<Tables<'shared_state'>>>, []>();
const tablesQueried: string[] = [];

interface Chain {
  eq: (column: string, value: string) => Chain;
  maybeSingle: () => Promise<MaybeSingle<unknown>>;
}

jest.mock('../client', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (table: string) => {
      tablesQueried.push(table);
      const resolver =
        table === 'pairing' ? mockPairingMaybeSingle : mockSharedMaybeSingle;
      const chain: Chain = {
        eq: () => chain,
        maybeSingle: () => resolver(),
      };
      return { select: () => chain };
    },
  },
}));

const FOLLOWER = 'follower-uuid';
const OWNER = 'owner-uuid';

const sharedRow: Tables<'shared_state'> = {
  owner_id: OWNER,
  current_phase: 'luteal',
  next_period_date: '2026-03-06',
  updated_at: '2026-03-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  tablesQueried.length = 0;
  mockGetUser.mockResolvedValue({ data: { user: { id: FOLLOWER } }, error: null });
  mockPairingMaybeSingle.mockResolvedValue({ data: { owner_id: OWNER }, error: null });
  mockSharedMaybeSingle.mockResolvedValue({ data: sharedRow, error: null });
});

describe('getFollowedSharedState', () => {
  it('resolves the active edge and returns connected with that owner shared_state', async () => {
    await expect(getFollowedSharedState()).resolves.toEqual({
      connected: true,
      state: sharedRow,
    });
    expect(tablesQueried).toEqual(['pairing', 'shared_state']);
  });

  it('never reads periods or daily_logs', async () => {
    await getFollowedSharedState();
    expect(tablesQueried).not.toContain('periods');
    expect(tablesQueried).not.toContain('daily_logs');
  });

  it('returns { connected: false } when there is no active edge (revoked)', async () => {
    mockPairingMaybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(getFollowedSharedState()).resolves.toEqual({ connected: false });
    expect(tablesQueried).toEqual(['pairing']);
  });

  it('returns { connected: false } when there is no session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    await expect(getFollowedSharedState()).resolves.toEqual({ connected: false });
    expect(tablesQueried).toEqual([]);
  });

  it('returns connected with null state when the owner has no shared row yet', async () => {
    mockSharedMaybeSingle.mockResolvedValue({ data: null, error: null });
    await expect(getFollowedSharedState()).resolves.toEqual({
      connected: true,
      state: null,
    });
    expect(tablesQueried).toEqual(['pairing', 'shared_state']);
  });
});
