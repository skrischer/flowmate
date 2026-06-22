/// <reference types="jest" />
import { MOODS } from '../../../lib/data';
import { MOOD_OPTIONS, moodLabel, parseMood } from '../mood';

// The data barrel transitively loads the Supabase client, which throws at import
// time without env config. The mood helpers under test never touch the client,
// so a bare stub keeps module init from failing (mirrors the prediction test).
jest.mock('../../../lib/data/client', () => ({ supabase: {} }));

describe('mood labels', () => {
  it('covers every curated mood in stored order', () => {
    expect(MOOD_OPTIONS.map((option) => option.value)).toEqual([...MOODS]);
  });

  it('pairs each mood with a non-empty German label', () => {
    for (const option of MOOD_OPTIONS) {
      expect(option.label.length).toBeGreaterThan(0);
      expect(moodLabel(option.value)).toBe(option.label);
    }
  });
});

describe('parseMood', () => {
  it('returns the mood for a value in the curated set', () => {
    expect(parseMood('content')).toBe('content');
    expect(parseMood('anxious')).toBe('anxious');
  });

  it('returns null for a value outside the curated set', () => {
    expect(parseMood('ecstatic')).toBeNull();
    expect(parseMood('')).toBeNull();
  });
});
