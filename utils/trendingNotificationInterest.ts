import { normalizeFeedPreferences } from '@/services/feedPreferences';
import { hasPersonalizationSignals } from '@/services/interestSignals';
import { articleAffinityScore } from '@/services/recommendations';
import { isSportsTopicActive } from '@/services/sportPreferences';
import { isAllTopicsEnabled } from '@/services/topicPreferences';
import { Article, UserPreferences } from '@/types';
import { isBreakingTrendingArticle } from '@/utils/trendingArticles';

/**
 * Whether a hot trending article should trigger a notification for this user.
 * Apply `applyTrendingNotificationFilters` (sources + topics/sports) before calling this.
 *
 * - Liked-article signals: notify when affinity score > 0 (topics, sources, keywords).
 * - No likes: require Profile topic/sport filters (not source toggles alone) and only
 *   breaking (<1h) stories so outlet bursts do not spam the whole catalog.
 * - All topics + all sources + no likes: never notify.
 */
export function isTrendingNotificationRelevant(
  article: Article,
  preferences: UserPreferences,
  nowMs: number = Date.now(),
): boolean {
  const prefs = normalizeFeedPreferences(preferences);

  if (hasPersonalizationSignals(prefs)) {
    return articleAffinityScore(article, prefs) > 0;
  }

  const topicsNarrowed = !isAllTopicsEnabled(prefs.enabledTopics);
  const sportsNarrowed =
    prefs.enabledSportTags.length > 0 && isSportsTopicActive(prefs.enabledTopics);

  if (!topicsNarrowed && !sportsNarrowed) {
    return false;
  }

  return isBreakingTrendingArticle(article, nowMs);
}
