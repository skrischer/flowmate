// Typed CRUD for the owner-keyed `periods` raw cycle log.
//
// This module is the ONLY access path to the periods table — components never
// call Supabase directly (constitution: cycle data only through lib/data/).
// Every row is owner-keyed: the owner is always the authenticated user, never a
// caller-supplied id, and RLS (owner_id = auth.uid()) is the enforcing boundary.
// Dates are ISO calendar days (YYYY-MM-DD); end_date is nullable (per-period).

import { supabase } from './client';
import type { Tables, TablesInsert, TablesUpdate } from './database.types';

/** A logged period row as stored, including the derived id and timestamps. */
export type Period = Tables<'periods'>;

/**
 * Fields a caller provides to log a period. `owner_id` is intentionally omitted:
 * it is resolved from the authenticated session, never passed in.
 */
export type NewPeriod = Omit<TablesInsert<'periods'>, 'owner_id' | 'id' | 'created_at'>;

/**
 * Fields a caller may change on an existing period. Ownership and identity
 * (`owner_id`, `id`, `created_at`) are not editable through this layer.
 */
export type PeriodUpdate = Omit<TablesUpdate<'periods'>, 'owner_id' | 'id' | 'created_at'>;

/** Resolves the authenticated user's id, throwing when no session exists. */
async function requireOwnerId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('No authenticated user: cannot resolve the period owner.');
  }
  return data.user.id;
}

/**
 * Logs a period for the current owner. `start_date` may be any past date
 * (historical backfill); `end_date` is optional. Returns the inserted row.
 */
export async function createPeriod(period: NewPeriod): Promise<Period> {
  const ownerId = await requireOwnerId();
  const { data, error } = await supabase
    .from('periods')
    .insert({ ...period, owner_id: ownerId })
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Lists the current owner's periods, most recent first (descending by
 * start_date). RLS restricts the result to the caller's own rows; no pagination
 * in v1 (spec).
 */
export async function listPeriods(): Promise<Period[]> {
  const { data, error } = await supabase
    .from('periods')
    .select()
    .order('start_date', { ascending: false });
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Updates one of the current owner's periods by id. RLS guarantees a caller can
 * only update its own rows. Returns the updated row.
 */
export async function updatePeriod(id: string, changes: PeriodUpdate): Promise<Period> {
  const { data, error } = await supabase
    .from('periods')
    .update(changes)
    .eq('id', id)
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Deletes one of the current owner's periods by id. RLS guarantees a caller can
 * only delete its own rows.
 */
export async function deletePeriod(id: string): Promise<void> {
  const { error } = await supabase.from('periods').delete().eq('id', id);
  if (error) {
    throw error;
  }
}
