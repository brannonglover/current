import AsyncStorage from '@react-native-async-storage/async-storage';

import { likedArticleSnapshot } from '@/services/likedArticles';
import { Article } from '@/types';

const FEED_SNAPSHOT_PREFIX = '@dailyfold/feed/';
export const MAX_FEED_SNAPSHOT_ARTICLES = 80;

function feedSnapshotKey(userId: string, sourceIdsKey: string): string {
  return `${FEED_SNAPSHOT_PREFIX}${userId}/${sourceIdsKey}`;
}

/** Trim and strip bodies before persisting — full body loads in the reader. */
export function trimFeedSnapshot(articles: Article[]): Article[] {
  return articles.slice(0, MAX_FEED_SNAPSHOT_ARTICLES).map(likedArticleSnapshot);
}

export async function loadFeedSnapshot(
  userId: string,
  sourceIdsKey: string,
): Promise<Article[] | null> {
  const raw = await AsyncStorage.getItem(feedSnapshotKey(userId, sourceIdsKey));
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return null;
    return parsed as Article[];
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
  await AsyncStorage.setItem(
    feedSnapshotKey(userId, sourceIdsKey),
    JSON.stringify(trimFeedSnapshot(articles)),
  );
}
