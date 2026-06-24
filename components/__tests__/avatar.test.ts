import { initials } from '../Avatar';

describe('initials', () => {
  it('returns a single uppercase letter from the display name (incl. parenthetical suffix)', () => {
    expect(initials('Mia (Flower-Test)')).toBe('M');
    expect(initials('Sam (Mate-Test)')).toBe('S');
    expect(initials('mia')).toBe('M');
  });

  it('falls back to the first letter of the fallback when the name is blank', () => {
    expect(initials(null, 'flower@flowmate.local')).toBe('F');
    expect(initials('   ', 'sam@example.io')).toBe('S');
  });

  it('returns the placeholder bullet when nothing is available', () => {
    expect(initials(null, null)).toBe('·');
    expect(initials('', '')).toBe('·');
  });
});
