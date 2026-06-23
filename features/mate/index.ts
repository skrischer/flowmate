// Public surface of the Mate attunement wiring (spec-mate-push.md). The route
// consumes the screen from here; the read-only lib/data follower path and the
// pure mapping stay behind this glue.

export { MateAttunementScreen } from './MateAttunementScreen';
export { MateProfileScreen } from './MateProfileScreen';
export { useMateAttunement } from './useMateAttunement';
export type { MateAttunementState } from './useMateAttunement';
export { isAttunementEmpty, toMateAttunement } from './attunement-view';
export type { MateAttunement } from './attunement-view';
