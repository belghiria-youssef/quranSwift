import { previousDateKey, toDateKey } from '@/core/utils/date';
import {
  currentStreak,
  teamStreak,
} from '@/domain/usecases/readingHistory';

const today = (): string => toDateKey(new Date());
const yesterday = (): string => previousDateKey(today());
const twoDaysAgo = (): string => previousDateKey(yesterday());
const threeDaysAgo = (): string => previousDateKey(twoDaysAgo());

describe('currentStreak', () => {
  it('returns 0 when nothing read', () => {
    expect(currentStreak([])).toBe(0);
  });

  it('returns 0 when not read today', () => {
    expect(currentStreak([yesterday()])).toBe(0);
  });

  it('counts today only', () => {
    expect(currentStreak([today()])).toBe(1);
  });

  it('counts consecutive days ending today', () => {
    expect(currentStreak([today(), yesterday(), twoDaysAgo()])).toBe(3);
  });

  it('stops at a gap', () => {
    expect(currentStreak([today(), twoDaysAgo()])).toBe(1);
  });
});

describe('teamStreak', () => {
  const all = (day: string) => [
    { lastReadDate: day },
    { lastReadDate: day },
    { lastReadDate: day },
  ];

  it('returns 0 for no members', () => {
    expect(teamStreak([])).toBe(0);
  });

  it('counts from yesterday when today incomplete', () => {
    const members = [
      { lastReadDate: yesterday() },
      { lastReadDate: yesterday() },
      { lastReadDate: twoDaysAgo() },
    ];
    expect(teamStreak(members)).toBe(2);
  });

  it('counts from today when all read today', () => {
    const members = [
      { lastReadDate: today() },
      { lastReadDate: today() },
      { lastReadDate: yesterday() },
    ];
    expect(teamStreak(members)).toBe(2);
  });

  it('returns 0 when nothing shared', () => {
    const members = [
      { lastReadDate: today() },
      { lastReadDate: null },
      { lastReadDate: threeDaysAgo() },
    ];
    expect(teamStreak(members)).toBe(0);
  });
});