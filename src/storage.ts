import AsyncStorage from '@react-native-async-storage/async-storage';
import { emptyState, STORAGE_KEY, TrackerState } from './domain';

export async function loadState(): Promise<TrackerState> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return emptyState;
  }

  const parsed: unknown = JSON.parse(raw);
  if (!parsed || typeof parsed !== 'object') {
    throw new Error('Saved tracker data is invalid.');
  }

  const value = parsed as Partial<TrackerState>;
  if (
    !Array.isArray(value.supplements) ||
    !value.takenByDate ||
    typeof value.takenByDate !== 'object' ||
    typeof value.remindersEnabled !== 'boolean'
  ) {
    throw new Error('Saved tracker data is invalid.');
  }

  return {
    supplements: value.supplements,
    takenByDate: value.takenByDate,
    remindersEnabled: value.remindersEnabled,
  };
}

export async function saveState(state: TrackerState): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}
