export type Supplement = {
  id: string;
  name: string;
  dose: string;
  reminderTime: string;
};

export type TrackerState = {
  supplements: Supplement[];
  takenByDate: Record<string, string[]>;
  remindersEnabled: boolean;
};

export const STORAGE_KEY = 'supplement-tracker-state';

export function dateKey(date = new Date()): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function toggleTaken(state: TrackerState, supplementId: string, date = new Date()): TrackerState {
  const key = dateKey(date);
  const taken = new Set(state.takenByDate[key] ?? []);
  if (taken.has(supplementId)) {
    taken.delete(supplementId);
  } else {
    taken.add(supplementId);
  }

  return {
    ...state,
    takenByDate: {
      ...state.takenByDate,
      [key]: [...taken],
    },
  };
}

export function isTaken(state: TrackerState, supplementId: string, date = new Date()): boolean {
  return state.takenByDate[dateKey(date)]?.includes(supplementId) ?? false;
}

export const emptyState: TrackerState = {
  supplements: [],
  takenByDate: {},
  remindersEnabled: false,
};
