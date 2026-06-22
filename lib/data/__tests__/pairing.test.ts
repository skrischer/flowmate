/// <reference types="jest" />
// Verifies the OWNER pairing-management paths: listActivePairings narrows reads
// to active edges (revoked history excluded by the query) and revokePairing flips
// status to `revoked` scoped to an active edge (the owner-only RLS policy is the
// enforcing boundary; here we assert the query shape that drives the immediate
// shared_state cut). No raw-log tables are touched.

import { listActivePairings, revokePairing } from '../pairing';
import type { Tables } from '../database.types';

type PairingRow = Tables<'pairing'>;
type ListResult = { data: PairingRow[]; error: unknown };
type UpdateResult = { error: unknown };

const mockOrder = jest.fn<Promise<ListResult>, []>();
const mockUpdate = jest.fn<UpdateResult, [Partial<PairingRow>]>();
const selectEqCalls: [string, string][] = [];
const updateEqCalls: [string, string][] = [];
const tablesQueried: string[] = [];

interface SelectChain {
  eq: (column: string, value: string) => SelectChain;
  order: () => Promise<ListResult>;
}

interface UpdateChain {
  eq: (column: string, value: string) => UpdateChain;
}

jest.mock('../client', () => ({
  supabase: {
    auth: {
      getUser: () =>
        Promise.resolve({ data: { user: { id: 'owner-uuid' } }, error: null }),
    },
    from: (table: string) => {
      tablesQueried.push(table);
      const selectChain: SelectChain = {
        eq: (column: string, value: string) => {
          selectEqCalls.push([column, value]);
          return selectChain;
        },
        order: () => mockOrder(),
      };
      return {
        select: () => selectChain,
        update: (patch: Partial<PairingRow>) => {
          const result = mockUpdate(patch);
          const updateChain: UpdateChain = {
            eq: (column: string, value: string) => {
              updateEqCalls.push([column, value]);
              // The terminal .eq resolves the builder; model both as thenable.
              return Object.assign(updateChain, {
                then: (resolve: (value: UpdateResult) => void) => resolve(result),
              });
            },
          };
          return updateChain;
        },
      };
    },
  },
}));

const ownerId = 'owner-uuid';
const followerId = 'follower-uuid';

const activeRow: PairingRow = {
  id: 'pairing-1',
  owner_id: ownerId,
  follower_id: followerId,
  status: 'active',
  created_at: '2026-03-01T00:00:00.000Z',
};

beforeEach(() => {
  jest.clearAllMocks();
  tablesQueried.length = 0;
  selectEqCalls.length = 0;
  updateEqCalls.length = 0;
  mockOrder.mockResolvedValue({ data: [activeRow], error: null });
  mockUpdate.mockReturnValue({ error: null });
});

describe('listActivePairings', () => {
  it('returns the active edges from the pairing table', async () => {
    await expect(listActivePairings()).resolves.toEqual([activeRow]);
    expect(tablesQueried).toEqual(['pairing']);
  });

  it('scopes the read to the owner and active edges', async () => {
    await listActivePairings();
    expect(selectEqCalls).toEqual([
      ['owner_id', 'owner-uuid'],
      ['status', 'active'],
    ]);
  });

  it('never reads periods or daily_logs', async () => {
    await listActivePairings();
    expect(tablesQueried).not.toContain('periods');
    expect(tablesQueried).not.toContain('daily_logs');
  });

  it('throws when the query errors', async () => {
    mockOrder.mockResolvedValue({ data: [], error: new Error('boom') });
    await expect(listActivePairings()).rejects.toThrow('boom');
  });
});

describe('revokePairing', () => {
  it('flips status to revoked scoped to the active edge', async () => {
    await revokePairing('pairing-1');
    expect(mockUpdate).toHaveBeenCalledWith({ status: 'revoked' });
    expect(updateEqCalls).toEqual([
      ['id', 'pairing-1'],
      ['status', 'active'],
    ]);
  });

  it('throws when the update errors', async () => {
    mockUpdate.mockReturnValue({ error: new Error('denied') });
    await expect(revokePairing('pairing-1')).rejects.toThrow('denied');
  });
});
