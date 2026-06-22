import { FlowerHomeScreen } from '../features/flower/FlowerHomeScreen';

// Owner/Flower home hub: phase card, next-period prediction, fertile window, and
// the navigation rows into the sub-screens. The screen lives in the feature so
// the route stays a thin entry point (matches periods / mood-log).
export default function Index() {
  return <FlowerHomeScreen />;
}
