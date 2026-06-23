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
export { getOwnProfile, ensureProfile, getPartnerProfile } from './profiles';
export type { Profile, ProfileResult, PartnerProfile } from './profiles';
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
export {
  getOwnPushToken,
  PUSH_PLATFORMS,
  registerPushToken,
  setPushEnabled,
} from './push-tokens';
export type { NewPushToken, PushPlatform, PushToken } from './push-tokens';
export {
  acceptInvite,
  createInvite,
  listActivePairings,
  revokePairing,
} from './pairing';
export type { Invite, Pairing } from './pairing';
export { getFollowedSharedState, refreshSharedState } from './shared-state';
export type { SharedState } from './shared-state';
export {
  getOnboardingComplete,
  resolveOnboardingNeeded,
  resolveShell,
  setOnboardingComplete,
} from './onboarding';
export type { Shell } from './onboarding';
