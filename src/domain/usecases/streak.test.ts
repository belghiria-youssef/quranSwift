import { previousDateKey, toDateKey } from '@/core/utils/date';
import { nextStreak } from '@/domain/usecases/streak';

describe('date keys', () => {
  test('toDateKey pads month and day', () => {
    expect(toDateKey(new Date(2026, 0, 5))).toBe('2026-01-05');
  });

  test('previousDateKey crosses month boundaries', () => {
    expect(previousDateKey('2026-03-01')).toBe('2026-02-28');
  });

  test('previousDateKey crosses year boundaries', () => {
    expect(previousDateKey('2026-01-01')).toBe('2025-12-31');
  });
});

describe('nextStreak', () => {
  test('starts at 1 for a first ever read', () => {
    expect(nextStreak(null, '2026-05-10', 0)).toBe(1);
  });

  test('does not change on a second read the same day', () => {
    expect(nextStreak('2026-05-10', '2026-05-10', 4)).toBe(4);
  });

  test('increments on a consecutive day', () => {
    expect(nextStreak('2026-05-09', '2026-05-10', 4)).toBe(5);
  });

  test('resets to 1 after a skipped day', () => {
    expect(nextStreak('2026-05-08', '2026-05-10', 7)).toBe(1);
  });
});
