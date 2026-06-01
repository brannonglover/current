import type { BottomTabNavigationProp } from '@react-navigation/bottom-tabs';
import type { ParamListBase } from '@react-navigation/native';
import { Image } from 'expo-image';
import { useFocusEffect, useNavigation } from 'expo-router';
import { useCallback, useMemo, useRef } from 'react';
import { StyleSheet } from 'react-native';

import { ArticleFeedHandle } from '@/components/ArticleFeed';
import { ArticleFeedScreen } from '@/components/ArticleFeedScreen';
import { FeedTopicFilterBar } from '@/components/FeedTopicFilterBar';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useArticles } from '@/hooks/useArticles';
import { isAllSourcesEnabled } from '@/services/sourcePreferences';
import { orderLatestFeed } from '@/utils/feedOrdering';
import { getFeedEmptyMessage } from '@/utils/feedEmptyMessage';

export default function LatestScreen() {
  const navigation = useNavigation<BottomTabNavigationProp<ParamListBase>>();
  const feedRef = useRef<ArticleFeedHandle>(null);
  const { articles, isLoading, isRefreshing, error, notice, usingDemoArticles, refresh } = useArticles();
  const { preferences, filterByEnabledSources, filterByEnabledTopics, filterByEnabledSportTags } =
    usePreferences();

  useFocusEffect(
    useCallback(() => {
      const unsubscribe = navigation.addListener('tabPress', () => {
        if (!navigation.isFocused()) return;
        void (async () => {
          await feedRef.current?.scrollToTop();
          await refresh();
        })();
      });
      return unsubscribe;
    }, [navigation, refresh]),
  );

  const filtered = useMemo(() => {
    const bySource = filterByEnabledSources(articles);
    const byTopic = filterByEnabledTopics(bySource);
    const bySport = filterByEnabledSportTags(byTopic);
    return orderLatestFeed(bySport);
  }, [articles, filterByEnabledSources, filterByEnabledTopics, filterByEnabledSportTags]);

  const sourceFiltered = useMemo(
    () =>
      filterByEnabledSources(
        [...articles].sort(
          (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
        ),
      ),
    [articles, filterByEnabledSources],
  );

  const emptyMessage = useMemo(
    () =>
      getFeedEmptyMessage({
        error,
        totalCount: articles.length,
        filteredCount: filtered.length,
        sourceFilteredCount: sourceFiltered.length,
        enabledTopics: preferences?.enabledTopics,
        enabledSportTags: preferences?.enabledSportTags,
        sourcesRestricted:
          !!preferences && !isAllSourcesEnabled(preferences.enabledSourceIds),
        usingDemoArticles,
      }),
    [
      error,
      articles.length,
      filtered.length,
      sourceFiltered.length,
      preferences?.enabledTopics,
      preferences?.enabledSportTags,
      preferences?.enabledSourceIds,
      usingDemoArticles,
    ],
  );

  return (
    <ArticleFeedScreen
      ref={feedRef}
      articles={filtered}
      title="Latest"
      titleTrailing={
        <Image
          source={require('@/assets/images/logo.png')}
          style={styles.brandLogo}
          contentFit="contain"
          accessibilityLabel="Current"
        />
      }
      emptyMessage={emptyMessage}
      isLoading={isLoading}
      isRefreshing={isRefreshing}
      error={error}
      notice={notice}
      onRefresh={refresh}
      headerExtra={<FeedTopicFilterBar />}
    />
  );
}

const styles = StyleSheet.create({
  brandLogo: {
    height: 28,
    width: 91,
    maxWidth: 120,
  },
});
