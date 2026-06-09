import AsyncStorage from '@react-native-async-storage/async-storage';

const PREFIX = '@dailyfold/trending-notified/';
const LAST_SENT_PREFIX = '@dailyfold/trending-notified-at/';
const MAX_STORED_IDS = 300;

/** Minimum gap between any two trending alerts (breaking, pressing, or liked picks). */
export const TRENDING_NOTIFICATION_COOLDOWN_MS = 60 * 60 * 1000;

export async function getNotifiedArticleIds(userId: string): Promise<Set<string>> {
  const raw = await AsyncStorage.getItem(`${PREFIX}${userId}`);
  if (!raw) return new Set();
  try {
    const ids = JSON.parse(raw) as string[];
    return new Set(Array.isArray(ids) ? ids : []);
  } catch {
    return new Set();
  }
}

export async function clearTrendingNotificationState(userId: string): Promise<void> {
  await Promise.all([
    AsyncStorage.removeItem(`${PREFIX}${userId}`),
    AsyncStorage.removeItem(`${LAST_SENT_PREFIX}${userId}`),
  ]);
}

export async function markArticleNotified(userId: string, articleId: string): Promise<void> {
  const ids = await getNotifiedArticleIds(userId);
  ids.add(articleId);

  const trimmed = [...ids].slice(-MAX_STORED_IDS);
  await AsyncStorage.setItem(`${PREFIX}${userId}`, JSON.stringify(trimmed));
}

export async function getLastTrendingNotificationSentAt(userId: string): Promise<number | null> {
  const raw = await AsyncStorage.getItem(`${LAST_SENT_PREFIX}${userId}`);
  if (!raw) return null;
  const ms = Number(raw);
  return Number.isFinite(ms) ? ms : null;
}

export async function markTrendingNotificationSent(userId: string, sentAtMs: number = Date.now()): Promise<void> {
  await AsyncStorage.setItem(`${LAST_SENT_PREFIX}${userId}`, String(sentAtMs));
}

export async function isWithinTrendingNotificationCooldown(
  userId: string,
  nowMs: number = Date.now(),
): Promise<boolean> {
  const last = await getLastTrendingNotificationSentAt(userId);
  if (last == null) return false;
  return nowMs - last < TRENDING_NOTIFICATION_COOLDOWN_MS;
}
