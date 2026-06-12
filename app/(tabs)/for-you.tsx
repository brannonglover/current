import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';

import { ArticleFeedScreen } from '@/components/ArticleFeedScreen';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useArticles } from '@/hooks/useArticles';
import { useDisplayOrderLock } from '@/hooks/useDisplayOrderLock';
import { buildLikedInterestProfile, hasInterestSignals } from '@/services/interestSignals';
import {
  buildArticleMatchReasonsById,
  getPersonalizedFeed,
  hasLikedArticles,
} from '@/services/recommendations';
import { isAllSourcesEnabled } from '@/services/sourcePreferences';
import { getForYouEmptyMessage } from '@/utils/feedEmptyMessage';
import { orderPersonalizedFeed } from '@/utils/feedOrdering';
import {
  insertDisplayNewcomersAtSourceOrder,
  mergePaginatedDisplayFeed,
  updateDisplayArticlesInPlace,
} from '@/utils/mergeDisplayFeed';
import { Article } from '@/types';

export default function ForYouScreen() {
  const {
    preferences,
    isLoading: isPreferencesLoading,
    personalizationSummary,
    filterFeedArticles,
  } = usePreferences();
  const {
    articles,
    feedGeneration,
    isLoading,
    isRefreshing,
    error,
    notice,
    usingDemoArticles,
    refresh,
  } = useArticles();

  const likedArticlesReady = preferences != null;
  const userHasLikedArticles = likedArticlesReady && hasLikedArticles(preferences);
  const [displayArticles, setDisplayArticles] = useState<Article[]>([]);
  const [displayReady, setDisplayReady] = useState(false);
  const prevFeedGenerationRef = useRef(0);
  const prevRawLengthRef = useRef(0);
  const syncDisplayHandledRef = useRef(false);
  const { markInitialDisplay, shouldAllowFullRebuild, shouldAllowSilentMerge } =
    useDisplayOrderLock(isRefreshing);

  useLayoutEffect(() => {
    syncDisplayHandledRef.current = false;
    if (!userHasLikedArticles || !preferences) {
      setDisplayArticles([]);
      setDisplayReady(false);
      prevRawLengthRef.current = 0;
      return;
    }

    const filtered = filterFeedArticles(articles);
    const ranked = getPersonalizedFeed(filtered, preferences);
    const generationChanged = feedGeneration !== prevFeedGenerationRef.current;

    if (generationChanged || prevRawLengthRef.current === 0) {
      syncDisplayHandledRef.current = true;
      if (shouldAllowFullRebuild(false, '', '')) {
        setDisplayArticles(orderPersonalizedFeed(ranked));
        markInitialDisplay();
        prevFeedGenerationRef.current = feedGeneration;
      } else {
        setDisplayArticles((prev) => updateDisplayArticlesInPlace(prev, ranked));
      }
      setDisplayReady(true);
    } else if (articles.length > prevRawLengthRef.current) {
      syncDisplayHandledRef.current = true;
      setDisplayArticles((prev) => {
        const seen = new Set(prev.map((a) => a.id));
        const newOnly = ranked.filter((a) => !seen.has(a.id));
        return mergePaginatedDisplayFeed(prev, newOnly, ranked, orderPersonalizedFeed);
      });
      setDisplayReady(true);
    }

    prevRawLengthRef.current = articles.length;
  }, [
    articles,
    feedGeneration,
    filterFeedArticles,
    preferences,
    userHasLikedArticles,
    markInitialDisplay,
    shouldAllowFullRebuild,
  ]);

  useEffect(() => {
    if (!userHasLikedArticles || !preferences || syncDisplayHandledRef.current) return;

    const filtered = filterFeedArticles(articles);
    const ranked = getPersonalizedFeed(filtered, preferences);
    setDisplayArticles((prev) => {
      if (prev.length === 0 && ranked.length > 0) {
        return orderPersonalizedFeed(ranked);
      }

      if (!shouldAllowSilentMerge()) {
        return updateDisplayArticlesInPlace(prev, ranked);
      }

      const prevIds = new Set(prev.map((article) => article.id));
      const newOnly = ranked.filter((article) => !prevIds.has(article.id));
      if (newOnly.length > 0) {
        return insertDisplayNewcomersAtSourceOrder(prev, newOnly, ranked);
      }

      return updateDisplayArticlesInPlace(prev, ranked);
    });
  }, [
    articles,
    feedGeneration,
    filterFeedArticles,
    preferences,
    userHasLikedArticles,
    shouldAllowSilentMerge,
  ]);

  const personalized = useMemo(() => {
    if (!userHasLikedArticles || !preferences) return [];
    if (displayReady) return displayArticles;
    if (articles.length === 0) return [];
    const filtered = filterFeedArticles(articles);
    return orderPersonalizedFeed(getPersonalizedFeed(filtered, preferences));
  }, [
    displayReady,
    displayArticles,
    articles,
    filterFeedArticles,
    preferences,
    userHasLikedArticles,
  ]);

  const matchReasonsByArticleId = useMemo(() => {
    if (!userHasLikedArticles || !preferences || personalized.length === 0) {
      return new Map<string, string[]>();
    }
    const filtered = filterFeedArticles(articles);
    const profile = buildLikedInterestProfile(preferences, [
      ...filtered,
      ...Object.values(preferences.likedArticles ?? {}),
    ]);
    return buildArticleMatchReasonsById(personalized, profile);
  }, [userHasLikedArticles, preferences, personalized, filterFeedArticles, articles]);

  const emptyMessage = useMemo(
    () => {
      const filtered = filterFeedArticles(articles);
      const profile = preferences
        ? buildLikedInterestProfile(preferences, [
            ...filtered,
            ...Object.values(preferences.likedArticles ?? {}),
          ])
        : null;
      return getForYouEmptyMessage({
        error,
        totalCount: articles.length,
        filteredCount: personalized.length,
        sourceFilteredCount: filtered.length,
        enabledTopics: preferences?.enabledTopics,
        enabledSportTags: preferences?.enabledSportTags,
        sourcesRestricted:
          !!preferences && !isAllSourcesEnabled(preferences.enabledSourceIds),
        usingDemoArticles,
        hasLikedArticles: userHasLikedArticles,
        hasInterestProfile: profile ? hasInterestSignals(profile) : false,
      });
    },
    [
      error,
      articles.length,
      personalized.length,
      preferences?.enabledTopics,
      preferences?.enabledSportTags,
      preferences?.enabledSourceIds,
      usingDemoArticles,
      userHasLikedArticles,
      filterFeedArticles,
      articles,
    ],
  );

  return (
    <ArticleFeedScreen
      articles={personalized}
      title="For You"
      subtitle={personalizationSummary}
      matchReasonsByArticleId={matchReasonsByArticleId}
      emptyMessage={emptyMessage}
      isLoading={isLoading || (isPreferencesLoading && !likedArticlesReady)}
      isRefreshing={isRefreshing}
      error={error}
      notice={notice}
      onRefresh={refresh}
    />
  );
}
