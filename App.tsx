import { StatusBar } from 'expo-status-bar';
import * as Notifications from 'expo-notifications';
import { useEffect, useMemo, useState } from 'react';
import {
  Alert,
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { dateKey, emptyState, isTaken, Supplement, toggleTaken, TrackerState } from './src/domain';
import { loadState, saveState } from './src/storage';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

function parseReminderTime(value: string): { hour: number; minute: number } | null {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(value);
  return match ? { hour: Number(match[1]), minute: Number(match[2]) } : null;
}

async function scheduleReminders(supplements: Supplement[], enabled: boolean): Promise<boolean> {
  await Notifications.cancelAllScheduledNotificationsAsync();
  if (!enabled || supplements.length === 0) {
    return true;
  }

  const permissions = await Notifications.requestPermissionsAsync();
  if (!permissions.granted) {
    return false;
  }

  for (const supplement of supplements) {
    const time = parseReminderTime(supplement.reminderTime);
    if (!time) {
      continue;
    }
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Supplement reminder',
        body: `If it is time, take ${supplement.name} (${supplement.dose}) according to your label or clinician.`,
      },
      trigger: { type: Notifications.SchedulableTriggerInputTypes.DAILY, hour: time.hour, minute: time.minute },
    });
  }
  return true;
}

export default function App() {
  const [state, setState] = useState<TrackerState>(emptyState);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [name, setName] = useState('');
  const [dose, setDose] = useState('');
  const [reminderTime, setReminderTime] = useState('08:00');

  useEffect(() => {
    loadState()
      .then((savedState) => {
        setState(savedState);
        if (savedState.remindersEnabled) {
          scheduleReminders(savedState.supplements, true).catch(() =>
            Alert.alert('Could not restore reminders', 'Your tracker is available, but reminders could not be restored.'),
          );
        }
      })
      .catch(() => Alert.alert('Could not load your tracker', 'Your saved data could not be read. Please try again.'))
      .finally(() => setLoading(false));
  }, []);

  const takenCount = useMemo(
    () => state.supplements.filter((supplement) => isTaken(state, supplement.id)).length,
    [state],
  );

  async function updateState(nextState: TrackerState) {
    setState(nextState);
    setSaving(true);
    try {
      await saveState(nextState);
    } catch {
      Alert.alert('Could not save your update', 'Please try again. Your current screen may not reflect saved data.');
    } finally {
      setSaving(false);
    }
  }

  async function addSupplement() {
    const cleanName = name.trim();
    const cleanDose = dose.trim();
    if (!cleanName || !cleanDose || !parseReminderTime(reminderTime)) {
      Alert.alert('Complete the details', 'Add a supplement name, dose label, and time in HH:MM format.');
      return;
    }

    const supplement: Supplement = {
      id: `${Date.now()}-${cleanName}`,
      name: cleanName,
      dose: cleanDose,
      reminderTime,
    };
    await updateState({ ...state, supplements: [...state.supplements, supplement] });
    setName('');
    setDose('');
  }

  async function removeSupplement(id: string) {
    await updateState({
      ...state,
      supplements: state.supplements.filter((supplement) => supplement.id !== id),
      takenByDate: Object.fromEntries(
        Object.entries(state.takenByDate).map(([key, ids]) => [key, ids.filter((takenId) => takenId !== id)]),
      ),
    });
  }

  async function toggleReminders(value: boolean) {
    const nextState = { ...state, remindersEnabled: value };
    await updateState(nextState);
    const scheduled = await scheduleReminders(state.supplements, value);
    if (!scheduled) {
      await updateState({ ...state, remindersEnabled: false });
      Alert.alert('Notifications are off', 'The tracker still works, but reminders need notification permission in your device settings.');
    }
  }

  if (loading) {
    return <CenteredMessage message="Loading your tracker..." />;
  }

  const today = new Date();
  const todayLabel = today.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.eyebrow}>DAILY CHECK-IN</Text>
        <Text style={styles.title}>Have I taken it?</Text>
        <Text style={styles.date}>{todayLabel}</Text>

        <View style={styles.progressCard}>
          <Text style={styles.progressText}>
            {takenCount} of {state.supplements.length} marked taken
          </Text>
          <Text style={styles.progressHint}>Only mark a dose when you have taken it.</Text>
        </View>

        {state.supplements.length === 0 ? (
          <View style={styles.emptyCard}>
            <Text style={styles.cardTitle}>Start your list</Text>
            <Text style={styles.bodyText}>Add the supplements you want to remember. Use the dose shown on your product label.</Text>
          </View>
        ) : (
          state.supplements.map((supplement) => {
            const taken = isTaken(state, supplement.id);
            return (
              <View key={supplement.id} style={[styles.supplementCard, taken && styles.takenCard]}>
                <View style={styles.supplementInfo}>
                  <Text style={styles.supplementName}>{supplement.name}</Text>
                  <Text style={styles.bodyText}>{supplement.dose} · Reminder {supplement.reminderTime}</Text>
                  <Pressable onPress={() => removeSupplement(supplement.id)} accessibilityRole="button">
                    <Text style={styles.removeText}>Remove</Text>
                  </Pressable>
                </View>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel={taken ? `Undo ${supplement.name}` : `Mark ${supplement.name} as taken`}
                  style={[styles.takeButton, taken && styles.undoButton]}
                  onPress={() => updateState(toggleTaken(state, supplement.id))}
                >
                  <Text style={[styles.takeButtonText, taken && styles.undoButtonText]}>{taken ? 'Taken' : 'Mark taken'}</Text>
                </Pressable>
              </View>
            );
          })
        )}

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Add a supplement</Text>
          <TextInput value={name} onChangeText={setName} placeholder="Name (e.g. Vitamin D)" style={styles.input} />
          <TextInput value={dose} onChangeText={setDose} placeholder="Dose label (e.g. 1 capsule)" style={styles.input} />
          <TextInput
            value={reminderTime}
            onChangeText={setReminderTime}
            placeholder="Reminder time (HH:MM)"
            keyboardType="numbers-and-punctuation"
            style={styles.input}
          />
          <Pressable style={styles.addButton} onPress={addSupplement}>
            <Text style={styles.addButtonText}>Add to today</Text>
          </Pressable>
        </View>

        <View style={styles.reminderRow}>
          <View style={styles.reminderCopy}>
            <Text style={styles.sectionTitle}>Daily reminders</Text>
            <Text style={styles.bodyText}>Notifications are optional. The checklist works without them.</Text>
          </View>
          <Switch value={state.remindersEnabled} onValueChange={toggleReminders} />
        </View>

        <Text style={styles.safetyText}>
          Follow the product label or your clinician&apos;s instructions. If you are unsure whether you took a dose, do not take an extra dose just because of this app—ask a pharmacist or clinician.
        </Text>
        {saving && <Text style={styles.savingText}>Saving...</Text>}
        <Text accessibilityLabel={`Tracker date ${dateKey(today)}`} style={styles.hiddenDate}>{dateKey(today)}</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function CenteredMessage({ message }: { message: string }) {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.centered}><Text style={styles.bodyText}>{message}</Text></View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F6F8F5' },
  container: { padding: 24, paddingBottom: 48 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  eyebrow: { color: '#55745D', fontSize: 12, fontWeight: '700', letterSpacing: 1.4, marginTop: 16 },
  title: { color: '#17351F', fontSize: 34, fontWeight: '800', marginTop: 8 },
  date: { color: '#66736A', fontSize: 16, marginTop: 6 },
  progressCard: { backgroundColor: '#DDEDE0', borderRadius: 18, marginTop: 24, padding: 18 },
  progressText: { color: '#17351F', fontSize: 20, fontWeight: '700' },
  progressHint: { color: '#55745D', fontSize: 14, marginTop: 5 },
  emptyCard: { backgroundColor: '#FFFFFF', borderRadius: 18, marginTop: 16, padding: 18 },
  cardTitle: { color: '#17351F', fontSize: 18, fontWeight: '700', marginBottom: 6 },
  bodyText: { color: '#66736A', fontSize: 14, lineHeight: 20 },
  supplementCard: { alignItems: 'center', backgroundColor: '#FFFFFF', borderRadius: 18, flexDirection: 'row', justifyContent: 'space-between', marginTop: 12, padding: 16 },
  takenCard: { backgroundColor: '#E8F4EA' },
  supplementInfo: { flex: 1, paddingRight: 12 },
  supplementName: { color: '#17351F', fontSize: 17, fontWeight: '700', marginBottom: 3 },
  removeText: { color: '#9A5147', fontSize: 13, fontWeight: '600', marginTop: 8 },
  takeButton: { backgroundColor: '#2F7041', borderRadius: 12, paddingHorizontal: 13, paddingVertical: 11 },
  takeButtonText: { color: '#FFFFFF', fontSize: 13, fontWeight: '700' },
  undoButton: { backgroundColor: '#FFFFFF', borderColor: '#6E9A76', borderWidth: 1 },
  undoButtonText: { color: '#2F7041' },
  section: { marginTop: 28 },
  sectionTitle: { color: '#17351F', fontSize: 18, fontWeight: '700', marginBottom: 10 },
  input: { backgroundColor: '#FFFFFF', borderColor: '#D6DED7', borderRadius: 12, borderWidth: 1, color: '#17351F', fontSize: 15, marginTop: 9, padding: 14 },
  addButton: { alignItems: 'center', backgroundColor: '#17351F', borderRadius: 12, marginTop: 12, padding: 15 },
  addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  reminderRow: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginTop: 28 },
  reminderCopy: { flex: 1, paddingRight: 18 },
  safetyText: { color: '#66736A', fontSize: 13, lineHeight: 19, marginTop: 28 },
  savingText: { color: '#55745D', fontSize: 12, marginTop: 14 },
  hiddenDate: { height: 0, opacity: 0, width: 0 },
});
