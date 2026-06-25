/// <reference types="jest" />
import {
  rangeRoleOf,
  selectDay,
  type RangeSelection,
} from '../range-selection';

describe('selectDay', () => {
  it('anchors the start and clears the end when no start is set yet', () => {
    const next = selectDay({ start: '', end: null }, '2026-06-10');
    expect(next).toEqual({ start: '2026-06-10', end: null });
  });

  it('sets the end when tapping on or after the start', () => {
    const next = selectDay({ start: '2026-06-10', end: null }, '2026-06-15');
    expect(next).toEqual({ start: '2026-06-10', end: '2026-06-15' });
  });

  it('treats a tap on the start itself as a single-day end', () => {
    const next = selectDay({ start: '2026-06-10', end: null }, '2026-06-10');
    expect(next).toEqual({ start: '2026-06-10', end: '2026-06-10' });
  });

  it('re-anchors the start and clears the end when tapping before the start', () => {
    const next = selectDay({ start: '2026-06-10', end: '2026-06-15' }, '2026-06-05');
    expect(next).toEqual({ start: '2026-06-05', end: null });
  });

  it('moves the end when a range is already complete (correctable in place)', () => {
    const next = selectDay({ start: '2026-06-10', end: '2026-06-20' }, '2026-06-14');
    expect(next).toEqual({ start: '2026-06-10', end: '2026-06-14' });
  });

  it('never produces an end before the start across re-anchors', () => {
    let state: RangeSelection = { start: '2026-06-10', end: '2026-06-20' };
    state = selectDay(state, '2026-06-03'); // tap before start re-anchors
    expect(state).toEqual({ start: '2026-06-03', end: null });
    state = selectDay(state, '2026-06-08'); // now on/after start sets the end
    expect(state.end).not.toBeNull();
    expect(state.end! >= state.start).toBe(true);
  });
});

describe('rangeRoleOf', () => {
  const range: RangeSelection = { start: '2026-06-10', end: '2026-06-13' };

  it('returns none when no start is selected', () => {
    expect(rangeRoleOf({ start: '', end: null }, '2026-06-10')).toBe('none');
  });

  it('marks the start, the end, and the days strictly between', () => {
    expect(rangeRoleOf(range, '2026-06-10')).toBe('start');
    expect(rangeRoleOf(range, '2026-06-13')).toBe('end');
    expect(rangeRoleOf(range, '2026-06-11')).toBe('between');
    expect(rangeRoleOf(range, '2026-06-12')).toBe('between');
  });

  it('does not mark days outside the range', () => {
    expect(rangeRoleOf(range, '2026-06-09')).toBe('none');
    expect(rangeRoleOf(range, '2026-06-14')).toBe('none');
  });

  it('marks only the start when the end is open', () => {
    const open: RangeSelection = { start: '2026-06-10', end: null };
    expect(rangeRoleOf(open, '2026-06-10')).toBe('start');
    expect(rangeRoleOf(open, '2026-06-11')).toBe('none');
  });

  it('reads a single-day range (start === end) as the start', () => {
    const single: RangeSelection = { start: '2026-06-10', end: '2026-06-10' };
    expect(rangeRoleOf(single, '2026-06-10')).toBe('start');
  });
});
