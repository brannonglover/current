import { useMemo } from 'react';

import { ArticleFeedScreen } from '@/components/ArticleFeedScreen';
import { FeedTopicFilterBar } from '@/components/FeedTopicFilterBar';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useArticles } from '@/hooks/useArticles';
import { getPersonalizedFeed, hasLikedArticles } from '@/services/recommendations';
import { isAllSourcesEnabled } from '@/services/sourcePreferences';
import { getForYouEmptyMessage } from '@/utils/feedEmptyMessage';
import { orderPersonalizedFeed } from '@/utils/feedOrdering';

export default function ForYouScreen() {
  const {
    preferences,
    isLoading: isPreferencesLoading,
    personalizationSummary,
    filterByEnabledSources,
    filterByEnabledTopics,
    filterByEnabledSportTags,
  } = usePreferences();
  const { articles, isLoading, isRefreshing, error, notice, usingDemoArticles, refresh } = useArticles();

  const likedArticlesReady = preferences != null;
  const userHasLikedArticles = likedArticlesReady && hasLikedArticles(preferences);

  const sourceFiltered = useMemo(
    () => filterByEnabledSources(articles),
    [articles, filterByEnabledSources],
  );

  const personalized = useMemo(() => {
    if (!userHasLikedArticles) return [];
    const byTopic = filterByEnabledTopics(sourceFiltered);
    const bySport = filterByEnabledSportTags(byTopic);
    return orderPersonalizedFeed(getPersonalizedFeed(bySport, preferences));
  }, [
    sourceFiltered,
    preferences,
    userHasLikedArticles,
    filterByEnabledTopics,
    filterByEnabledSportTags,
  ]);

  const emptyMessage = useMemo(
    () =>
      getForYouEmptyMessage({
        error,
        totalCount: articles.length,
        filteredCount: personalized.length,
        sourceFilteredCount: sourceFiltered.length,
        enabledTopics: preferences?.enabledTopics,
        enabledSportTags: preferences?.enabledSportTags,
        sourcesRestricted:
          !!preferences && !isAllSourcesEnabled(preferences.enabledSourceIds),
        usingDemoArticles,
        hasLikedArticles: userHasLikedArticles,
      }),
    [
      error,
      articles.length,
      personalized.length,
      sourceFiltered.length,
      preferences?.enabledTopics,
      preferences?.enabledSportTags,
      preferences?.enabledSourceIds,
      usingDemoArticles,
      userHasLikedArticles,
    ],
  );

  return (
    <ArticleFeedScreen
      articles={personalized}
      title="For You"
      subtitle={personalizationSummary}
      emptyMessage={emptyMessage}
      isLoading={isLoading || (isPreferencesLoading && !likedArticlesReady)}
      isRefreshing={isRefreshing}
      error={error}
      notice={notice}
      onRefresh={refresh}
      headerExtra={<FeedTopicFilterBar />}
    />
  );
}
