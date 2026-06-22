export { supabase } from './client';
export type { Database } from './database.types';
export {
  signUp,
  signIn,
  signOut,
  getSession,
  onAuthStateChange,
} from './auth';
export type { AuthResult, Credentials } from './auth';
export { getOwnProfile, ensureProfile } from './profiles';
export type { Profile, ProfileResult } from './profiles';
export { createPeriod, deletePeriod, listPeriods, updatePeriod } from './periods';
export type { NewPeriod, Period, PeriodUpdate } from './periods';
export {
  deleteDailyLog,
  getDailyLog,
  listDailyLogs,
  MOODS,
  upsertDailyLog,
} from './daily-logs';
export type { DailyLog, Mood, NewDailyLog } from './daily-logs';
