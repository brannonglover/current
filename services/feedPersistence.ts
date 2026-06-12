import AsyncStorage from '@react-native-async-storage/async-storage';

import { likedArticleSnapshot } from '@/services/likedArticles';
import { Article } from '@/types';

const FEED_SNAPSHOT_PREFIX = '@dailyfold/feed/';
export const MAX_FEED_SNAPSHOT_ARTICLES = 80;

const memorySnapshots = new Map<string, Article[]>();

function feedSnapshotKey(userId: string, sourceIdsKey: string): string {
  return `${FEED_SNAPSHOT_PREFIX}${userId}/${sourceIdsKey}`;
}

function memoryKey(userId: string, sourceIdsKey: string): string {
  return `${userId}/${sourceIdsKey}`;
}

/** Trim and strip bodies before persisting — full body loads in the reader. */
export function trimFeedSnapshot(articles: Article[]): Article[] {
  return articles.slice(0, MAX_FEED_SNAPSHOT_ARTICLES).map(likedArticleSnapshot);
}

export async function loadFeedSnapshot(
  userId: string,
  sourceIdsKey: string,
): Promise<Article[] | null> {
  const cached = memorySnapshots.get(memoryKey(userId, sourceIdsKey));
  if (cached && cached.length > 0) return cached;

  const raw = await AsyncStorage.getItem(feedSnapshotKey(userId, sourceIdsKey));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    const articles = parsed as Article[];
    if (articles.length > 0) {
      memorySnapshots.set(memoryKey(userId, sourceIdsKey), articles);
    }
    return articles;
  } catch {
    return null;
  }
}

export async function saveFeedSnapshot(
  userId: string,
  sourceIdsKey: string,
  articles: Article[],
): Promise<void> {
  if (articles.length === 0) return;
  const trimmed = trimFeedSnapshot(articles);
  memorySnapshots.set(memoryKey(userId, sourceIdsKey), trimmed);
  await AsyncStorage.setItem(
    feedSnapshotKey(userId, sourceIdsKey),
    JSON.stringify(trimmed),
  );
}
