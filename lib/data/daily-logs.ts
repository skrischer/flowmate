// Typed CRUD for the owner-keyed `daily_logs` raw light-mood log.
//
// This module is the ONLY access path to the daily_logs table — components
// never call Supabase directly (constitution: cycle data only through
// lib/data/). Every row is owner-keyed: the owner is always the authenticated
// user, never a caller-supplied id, and RLS (owner_id = auth.uid()) is the
// enforcing boundary. Dates are ISO calendar days (YYYY-MM-DD); there is at most
// one row per (owner_id, date), so logging is an UPSERT on that pair — never a
// blind insert that could duplicate a day.

import { supabase } from './client';
import type { Tables } from './database.types';

/**
 * The curated mood set (vision: USP is Gemuet, not a quantified-self tracker).
 * Mirrors the DB CHECK constraint; kept as a literal union so callers cannot
 * pass an unconstrained string. Symptoms are intentionally absent in v1.
 */
export const MOODS = ['content', 'calm', 'sensitive', 'irritable', 'low', 'anxious'] as const;

export type Mood = (typeof MOODS)[number];

/** A logged daily-mood row as stored, including the derived id and timestamp. */
export type DailyLog = Tables<'daily_logs'>;

/**
 * Fields a caller provides to log a mood for a day. `owner_id`, `id`, and
 * `created_at` are intentionally omitted: ownership is resolved from the
 * authenticated session, never passed in. `mood` is the curated union, narrower
 * than the generated `string` type.
 */
export type NewDailyLog = {
  date: string;
  mood: Mood;
};

/** Resolves the authenticated user's id, throwing when no session exists. */
async function requireOwnerId(): Promise<string> {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    throw error;
  }
  if (!data.user) {
    throw new Error('No authenticated user: cannot resolve the daily-log owner.');
  }
  return data.user.id;
}

/**
 * Logs (creates or updates) the current owner's mood for a single day. Upserts
 * on the (owner_id, date) unique pair: a second call for the same date replaces
 * the mood rather than inserting a duplicate. `date` may be any past day
 * (historical backfill). Returns the stored row.
 */
export async function upsertDailyLog(log: NewDailyLog): Promise<DailyLog> {
  const ownerId = await requireOwnerId();
  const { data, error } = await supabase
    .from('daily_logs')
    .upsert({ ...log, owner_id: ownerId }, { onConflict: 'owner_id,date' })
    .select()
    .single();
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Lists the current owner's daily logs, most recent day first (descending by
 * date). RLS restricts the result to the caller's own rows; no pagination in v1
 * (spec).
 */
export async function listDailyLogs(): Promise<DailyLog[]> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select()
    .order('date', { ascending: false });
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Reads the current owner's logged mood for a single day, or `null` when that
 * day has no entry. RLS restricts the lookup to the caller's own rows.
 */
export async function getDailyLog(date: string): Promise<DailyLog | null> {
  const { data, error } = await supabase
    .from('daily_logs')
    .select()
    .eq('date', date)
    .maybeSingle();
  if (error) {
    throw error;
  }
  return data;
}

/**
 * Deletes the current owner's mood entry for a single day. RLS guarantees a
 * caller can only delete its own rows; deleting a day with no entry is a no-op.
 */
export async function deleteDailyLog(date: string): Promise<void> {
  const { error } = await supabase.from('daily_logs').delete().eq('date', date);
  if (error) {
    throw error;
  }
}
