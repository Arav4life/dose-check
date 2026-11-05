import { dateKey, emptyState, isTaken, toggleTaken } from './domain';

describe('supplement tracker state', () => {
  const today = new Date(2026, 10, 5, 9);

  it('formats a local calendar date consistently', () => {
    expect(dateKey(today)).toBe('2026-11-05');
  });

  it('toggles a supplement and can undo the mark', () => {
    const marked = toggleTaken({ ...emptyState, supplements: [{ id: 'one', name: 'Vitamin D', dose: '1 capsule', reminderTime: '08:00' }] }, 'one', today);
    expect(isTaken(marked, 'one', today)).toBe(true);
    const undone = toggleTaken(marked, 'one', today);
    expect(isTaken(undone, 'one', today)).toBe(false);
  });

  it('keeps different calendar days separate', () => {
    const marked = toggleTaken({ ...emptyState }, 'one', today);
    expect(isTaken(marked, 'one', new Date(2026, 10, 6, 9))).toBe(false);
  });
});
