import { Platform } from 'react-native';

import {
  ensureTrendingNotificationChannel,
  getNotificationPermissionGranted,
  notificationsAvailable,
  scheduleLocalNotification,
  TRENDING_CHANNEL_ID,
} from '@/services/notificationSetup';
import { normalizeFeedPreferences } from '@/services/feedPreferences';
import { hasPersonalizationSignals } from '@/services/interestSignals';
import {
  getNotifiedArticleIds,
  isWithinColdStartTrendingCooldown,
  markArticleNotified,
  markTrendingNotificationSent,
} from '@/services/trendingNotificationState';
import { Article, UserPreferences } from '@/types';
import { findHotTrendingCandidates } from '@/utils/trendingArticles';
import { isTrendingNotificationRelevant } from '@/utils/trendingNotificationInterest';

/**
 * Local notifications when the app learns of new hot trending stories.
 * Remote push can reuse the same payload shape: `{ articleId: string }`.
 */
export async function presentHotTrendingNotification(article: Article): Promise<void> {
  if (!notificationsAvailable()) return;

  await ensureTrendingNotificationChannel();

  await scheduleLocalNotification({
    title: 'Trending now',
    body: `${article.title} — ${article.source}`,
    data: { articleId: article.id },
    ...(Platform.OS === 'android' ? { channelId: TRENDING_CHANNEL_ID } : {}),
  });
}

export async function processHotTrendingNotifications(
  userId: string,
  articles: Article[],
  enabled: boolean,
  preferences?: UserPreferences,
): Promise<void> {
  if (!enabled || !notificationsAvailable()) return;
  if (!(await getNotificationPermissionGranted())) return;

  const prefs = preferences ? normalizeFeedPreferences(preferences) : null;
  if (
    prefs &&
    !hasPersonalizationSignals(prefs) &&
    (await isWithinColdStartTrendingCooldown(userId))
  ) {
    return;
  }

  const notified = await getNotifiedArticleIds(userId);
  const candidates = findHotTrendingCandidates(articles);
  const next = candidates.find((c) => {
    if (notified.has(c.article.id)) return false;
    if (preferences && !isTrendingNotificationRelevant(c.article, preferences)) return false;
    return true;
  });
  if (!next) return;

  await presentHotTrendingNotification(next.article);
  await markArticleNotified(userId, next.article.id);
  if (prefs && !hasPersonalizationSignals(prefs)) {
    await markTrendingNotificationSent(userId);
  }
}
