import { FlowerHomeScreen } from '../../features/flower/FlowerHomeScreen';

// Flower "Heute" tab: phase card, prediction, and fertile window.
// Navigation to secondary screens (periods, mood-log, calendar, etc.)
// is done via router.push from within the screen.
export default function Index() {
  return <FlowerHomeScreen />;
}
