import AsyncStorage from '@react-native-async-storage/async-storage';

/** Device-level opt-in for temporary World Cup match alerts (easy to delete with the tab). */
const STORAGE_KEY = '@dailyfold/world-cup-match-notifications';

export async function getWorldCupMatchNotificationsEnabled(): Promise<boolean> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  return raw === 'true';
}

export async function setWorldCupMatchNotificationsEnabled(enabled: boolean): Promise<void> {
  await AsyncStorage.setItem(STORAGE_KEY, enabled ? 'true' : 'false');
}
