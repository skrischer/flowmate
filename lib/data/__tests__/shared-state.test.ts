/// <reference types="jest" />
// Verifies the owner write path derives shared_state from the real prediction
// engine (today injected) and upserts only phase-level fields keyed on the
// authenticated owner -- never raw health data, never a follower-supplied id.

import { refreshSharedState } from '../shared-state';
import type { Period } from '../periods';
import type { TablesInsert } from '../database.types';

type SharedStateInsert = TablesInsert<'shared_state'>;
type UpsertOptions = { onConflict: string };

const mockGetUser = jest.fn();
const mockUpsertSingle = jest.fn();
const mockUpsert = jest.fn(
  (_payload: SharedStateInsert, _options: UpsertOptions) => ({
    select: () => ({ single: mockUpsertSingle }),
  }),
);
const mockFrom = jest.fn((_table: string) => ({ upsert: mockUpsert }));

jest.mock('../client', () => ({
  supabase: {
    auth: { getUser: () => mockGetUser() },
    from: (table: string) => mockFrom(table),
  },
}));

const mockListPeriods = jest.fn();
jest.mock('../periods', () => ({
  listPeriods: () => mockListPeriods(),
}));

const OWNER = 'owner-uuid';

const period = (start_date: string): Period => ({
  id: `id-${start_date}`,
  owner_id: OWNER,
  start_date,
  end_date: null,
  created_at: '2026-01-01T00:00:00.000Z',
});

beforeEach(() => {
  jest.clearAllMocks();
  mockGetUser.mockResolvedValue({ data: { user: { id: OWNER } }, error: null });
  mockUpsertSingle.mockResolvedValue({
    data: { owner_id: OWNER, current_phase: null, next_period_date: null, updated_at: 'now' },
    error: null,
  });
});

/** The [payload, options] of the single upsert; asserts it was called once. */
function upsertCall(): [SharedStateInsert, UpsertOptions] {
  const call = mockUpsert.mock.calls[0];
  if (call === undefined) {
    throw new Error('expected shared_state upsert to have been called');
  }
  return call;
}

describe('refreshSharedState', () => {
  it('upserts the derived phase + next-period heads-up keyed on the owner', async () => {
    mockListPeriods.mockResolvedValue([
      period('2026-01-01'),
      period('2026-01-29'),
      period('2026-02-26'),
    ]);

    await refreshSharedState('2026-03-06');

    expect(mockFrom).toHaveBeenCalledWith('shared_state');
    const [payload, options] = upsertCall();
    expect(options).toEqual({ onConflict: 'owner_id' });
    expect(payload).toMatchObject({
      owner_id: OWNER,
      current_phase: 'follicular',
      next_period_date: '2026-03-26',
    });
  });

  it('writes null phase fields when history cannot anchor a cycle', async () => {
    mockListPeriods.mockResolvedValue([period('2026-01-01')]);

    await refreshSharedState('2026-01-15');

    const [payload] = upsertCall();
    expect(payload).toMatchObject({
      owner_id: OWNER,
      current_phase: null,
      next_period_date: null,
    });
  });

  it('carries ONLY phase-level fields -- never raw period dates or logs', async () => {
    mockListPeriods.mockResolvedValue([
      period('2026-01-01'),
      period('2026-01-29'),
      period('2026-02-26'),
    ]);

    await refreshSharedState('2026-03-01');

    const [payload] = upsertCall();
    expect(Object.keys(payload).sort()).toEqual([
      'current_phase',
      'next_period_date',
      'owner_id',
      'updated_at',
    ]);
  });

  it('uses the authenticated owner id, never a caller-supplied one', async () => {
    mockListPeriods.mockResolvedValue([]);

    await refreshSharedState('2026-03-01');

    const [payload] = upsertCall();
    expect(payload.owner_id).toBe(OWNER);
  });

  it('throws when there is no authenticated session', async () => {
    mockGetUser.mockResolvedValue({ data: { user: null }, error: null });
    mockListPeriods.mockResolvedValue([]);

    await expect(refreshSharedState('2026-03-01')).rejects.toThrow('No authenticated user');
  });
});
