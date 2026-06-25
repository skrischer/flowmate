// Icon system for Flowmate — single import point for all app icons.
//
// Usage:
//   import { Icon } from '../components/Icon';
//   <Icon name="bell" />
//   <Icon name="chevron" color={colors.primary} size={20} />
//
// All icons use Ionicons (bundled via @expo/vector-icons, no native linking).
// Semantic names map to concrete Ionicons glyphs so surfaces never reference
// raw glyph strings — swap the glyph in one place if the design changes.
//
// Available names:
//   Navigation / tabs:  today, calendar, person, attunement
//   Actions:            plus, copy, share, refresh, trash, logout, close
//   State / feedback:   check, eye, eyeOff, info, bell, lock, clock
//   Navigation arrows:  chevron, back
//   Profile rows:       appearance, pairing
import { Ionicons } from '@expo/vector-icons';
import type { ColorValue } from 'react-native';

import { colors } from '../lib/theme';

// Supported semantic icon names — extend here when new glyphs are needed.
export type IconName =
  // bottom-tab icons
  | 'today'
  | 'calendar'
  | 'person'
  | 'attunement' // Mate "Eingestimmt" tab — wave/pulse glyph
  // actions
  | 'plus'
  | 'copy'
  | 'share'
  | 'refresh'
  | 'trash'
  | 'logout'
  | 'close'
  // state / feedback
  | 'check'
  | 'eye'
  | 'eyeOff'
  | 'info'
  | 'warning' // low-confidence caveat banner
  | 'bell'
  | 'lock'
  | 'clock'
  // navigation arrows
  | 'chevron' // forward / right
  | 'back' // backward / left
  // profile-row icons
  | 'appearance' // moon (theme toggle)
  | 'pairing'; // person-add (mate management)

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

// Map every semantic name to a concrete Ionicons glyph name.
const ICON_MAP: Record<IconName, IoniconName> = {
  today: 'home',
  calendar: 'calendar',
  person: 'person',
  attunement: 'pulse-outline',
  plus: 'add',
  copy: 'copy-outline',
  share: 'share-social-outline',
  refresh: 'refresh-outline',
  trash: 'trash-outline',
  logout: 'log-out-outline',
  close: 'close',
  check: 'checkmark',
  eye: 'eye-outline',
  eyeOff: 'eye-off-outline',
  info: 'information-circle-outline',
  warning: 'warning-outline',
  bell: 'notifications-outline',
  lock: 'lock-closed-outline',
  clock: 'time-outline',
  chevron: 'chevron-forward',
  back: 'chevron-back',
  appearance: 'moon-outline',
  pairing: 'person-add-outline',
};

// Default size in dp. Matches 20px used across the Heather Dark design.
export const ICON_SIZE_DEFAULT = 20;

export interface IconProps {
  name: IconName;
  size?: number;
  // ColorValue accepts string hex tokens and opaque platform colors (e.g. system
  // dynamic colors on iOS) — required so tabBarIcon callbacks can pass color directly.
  color?: ColorValue;
}

/** Token-driven icon atom. Wraps Ionicons with semantic names and theme defaults. */
export function Icon({ name, size = ICON_SIZE_DEFAULT, color = colors.textMuted }: IconProps) {
  return <Ionicons name={ICON_MAP[name]} size={size} color={color} />;
}
