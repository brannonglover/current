import { SportTag, Topic } from '@/types';

import { isAllSportTagsEnabled, isSportsTopicActive } from '@/services/sportPreferences';
import { isAllTopicsEnabled } from '@/services/topicPreferences';

export const FOR_YOU_NO_LIKES_MESSAGE =
  'Like stories on Latest to build your For You feed. Tap the heart on articles you enjoy.';

export function getForYouEmptyMessage(options: {
  error?: string | null;
  totalCount: number;
  filteredCount: number;
  sourceFilteredCount: number;
  enabledTopics?: Topic[];
  enabledSportTags?: SportTag[];
  sourcesRestricted?: boolean;
  usingDemoArticles?: boolean;
  hasLikedArticles: boolean;
}): string | undefined {
  const { hasLikedArticles, error, totalCount } = options;

  if (!hasLikedArticles) {
    if (error && totalCount === 0) {
      return 'Could not load stories. Fix the connection above, then pull to refresh.';
    }
    return FOR_YOU_NO_LIKES_MESSAGE;
  }

  return getFeedEmptyMessage(options);
}

export function getFeedEmptyMessage(options: {
  error?: string | null;
  totalCount: number;
  filteredCount: number;
  sourceFilteredCount: number;
  enabledTopics?: Topic[];
  enabledSportTags?: SportTag[];
  sourcesRestricted?: boolean;
  usingDemoArticles?: boolean;
}): string | undefined {
  const {
    error,
    totalCount,
    filteredCount,
    sourceFilteredCount,
    enabledTopics,
    enabledSportTags,
    sourcesRestricted,
    usingDemoArticles,
  } = options;

  if (error && totalCount === 0) {
    return 'Could not load stories. Fix the connection above, then pull to refresh.';
  }

  if (totalCount > 0 && filteredCount === 0) {
    if (sourceFilteredCount === 0) {
      return 'No stories from your selected sources. Try enabling more in Profile → Sources.';
    }
    if (
      enabledSportTags &&
      enabledTopics &&
      isSportsTopicActive(enabledTopics) &&
      !isAllSportTagsEnabled(enabledSportTags)
    ) {
      if (usingDemoArticles) {
        return 'Demo stories have no sports feeds. Run npm run api and npm run api:ingest for Premier League coverage.';
      }
      return 'No stories match this sport filter yet. Pull to refresh after ingest, or enable PL sources in Profile → Sources.';
    }
    if (sourcesRestricted && isAllTopicsEnabled(enabledTopics ?? [])) {
      return 'Only stories from your enabled sources are shown. Turn on more outlets in Profile → Sources, or tap All topics if a category chip is still selected.';
    }
    return 'No stories match your selected topics. Try different categories or tap All.';
  }

  return undefined;
}
