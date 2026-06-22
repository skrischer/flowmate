import { MateAttunementScreen } from '../features/mate/MateAttunementScreen';

// Mate shell: the follower's read-only attunement view over the owner's
// shared_state (phase + heads-up + hint, no raw data). The screen lives in the
// feature so the route stays a thin entry point (matches index / periods).
export default function Mate() {
  return <MateAttunementScreen />;
}
