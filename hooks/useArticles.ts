import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AppState, AppStateStatus } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import { applyTrendingNotificationFilters } from '@/services/feedFilters';
import { normalizeFeedPreferences } from '@/services/feedPreferences';
import { getEnabledSourceIds, isAllSourcesEnabled } from '@/services/sourcePreferences';
import { isAllTopicsEnabled } from '@/services/topicPreferences';
import { fetchArticles } from '@/services/articles';
import { processHotTrendingNotifications } from '@/services/trendingNotifications';
import { Article } from '@/types';
import { articleFeedOrderUnchanged, mergeArticleFeed } from '@/utils/mergeArticleFeed';

interface UseArticlesResult {
  articles: Article[];
  isLoading: boolean;
  isRefreshing: boolean;
  isLoadingMore: boolean;
  hasMore: boolean;
  feedGeneration: number;
  error: string | null;
  notice: string | null;
  usingDemoArticles: boolean;
  refresh: () => Promise<void>;
  loadMore: () => Promise<void>;
}

type LoadMode = 'initial' | 'refresh' | 'silent' | 'append';

/** Delay before re-fetching after a background ingest was kicked off. */
const BACKGROUND_INGEST_REFETCH_MS = 18_000;

const silentRefreshListeners = new Set<() => void>();
let backgroundIngestRefetchTimer: ReturnType<typeof setTimeout> | null = null;

function scheduleGlobalSilentRefresh() {
  if (backgroundIngestRefetchTimer) return;
  backgroundIngestRefetchTimer = setTimeout(() => {
    backgroundIngestRefetchTimer = null;
    for (const listener of silentRefreshListeners) {
      listener();
    }
  }, BACKGROUND_INGEST_REFETCH_MS);
}

function appendUniqueArticles(prev: Article[], incoming: Article[]): Article[] {
  if (incoming.length === 0) return prev;
  const seen = new Set(prev.map((a) => a.id));
  const fresh = incoming.filter((a) => !seen.has(a.id));
  return fresh.length > 0 ? [...prev, ...fresh] : prev;
}

export function useArticles(): UseArticlesResult {
  const { user } = useAuth();
  const { preferences, sources } = usePreferences();
  const [articles, setArticles] = useState<Article[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [feedGeneration, setFeedGeneration] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [usingDemoArticles] = useState(false);
  const appState = useRef(AppState.currentState);
  const refreshInFlightRef = useRef(0);
  const loadMoreInFlightRef = useRef(false);
  const loadRef = useRef<
    ((mode: LoadMode, forceRefresh?: boolean, cursor?: string) => Promise<void>) | undefined
  >(undefined);

  const allTopicsSelected = useMemo(() => {
    if (!preferences) return true;
    return isAllTopicsEnabled(normalizeFeedPreferences(preferences).enabledTopics);
  }, [preferences]);

  const sourceIds = useMemo(() => {
    if (sources.length === 0) return [];
    if (!preferences || allTopicsSelected) return sources.map((s) => s.id);
    return getEnabledSourceIds(sources, preferences.enabledSourceIds);
  }, [preferences, sources, allTopicsSelected]);

  const sourceIdsKey = allTopicsSelected ? '__all_topics__' : sourceIds.join(',');

  const load = useCallback(
    async (mode: LoadMode = 'initial', forceRefresh = false, cursor?: string) => {
      if (mode === 'refresh') {
        refreshInFlightRef.current += 1;
        setIsRefreshing(true);
      } else if (mode === 'initial') {
        setIsLoading(true);
      } else if (mode === 'append') {
        setIsLoadingMore(true);
      }

      if (mode !== 'append') {
        setError(null);
        setNotice(null);
      }

      try {
        const restrictSources =
          preferences &&
          !allTopicsSelected &&
          !isAllSourcesEnabled(preferences.enabledSourceIds);
        const { articles: data, meta } = await fetchArticles({
          forceRefresh: mode === 'refresh' ? forceRefresh : false,
          sourceIds: restrictSources && sourceIds.length > 0 ? sourceIds : undefined,
          cursor: mode === 'append' ? cursor : undefined,
        });

        if (mode === 'append') {
          setArticles((prev) => appendUniqueArticles(prev, data));
        } else {
          setArticles((prev) => {
            if (mode === 'silent' && prev.length > 0) {
              const merged = mergeArticleFeed(prev, data);
              return articleFeedOrderUnchanged(prev, merged) ? prev : merged;
            }
            return data;
          });
          setFeedGeneration((g) => g + 1);
        }

        setHasMore(meta?.hasMore ?? false);
        setNextCursor(meta?.nextCursor ?? null);

        if (meta?.ingestTriggered && !meta.ingestAwaited) {
          scheduleGlobalSilentRefresh();
        }

        if (
          user &&
          preferences?.trendingNotificationsEnabled &&
          mode !== 'append'
        ) {
          const forTrending = applyTrendingNotificationFilters(data, preferences, sources);
          void processHotTrendingNotifications(user.id, forTrending, true, preferences);
        }
      } catch (e) {
        if (mode !== 'append') {
          setError(e instanceof Error ? e.message : 'Failed to load articles');
          setNotice(null);
        }
      } finally {
        if (mode === 'initial') setIsLoading(false);
        if (mode === 'refresh') {
          refreshInFlightRef.current -= 1;
          if (refreshInFlightRef.current <= 0) {
            refreshInFlightRef.current = 0;
            setIsRefreshing(false);
          }
        }
        if (mode === 'append') setIsLoadingMore(false);
      }
    },
    [sourceIds, preferences, allTopicsSelected, user, sources],
  );

  loadRef.current = load;

  useEffect(() => {
    if (sources.length === 0) return;
    setNextCursor(null);
    setHasMore(false);
    load('initial');
  }, [load, sources.length, sourceIdsKey]);

  useEffect(() => {
    if (sources.length === 0) return;

    const onSilentRefresh = () => {
      void loadRef.current?.('silent', false);
    };
    silentRefreshListeners.add(onSilentRefresh);

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (appState.current.match(/inactive|background/) && nextState === 'active') {
        void loadRef.current?.('silent', false);
      }
      appState.current = nextState;
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => {
      silentRefreshListeners.delete(onSilentRefresh);
      subscription.remove();
    };
  }, [sources.length, sourceIdsKey]);

  const refresh = useCallback(async () => {
    await load('refresh', true);
  }, [load]);

  const loadMore = useCallback(async () => {
    if (!hasMore || !nextCursor || loadMoreInFlightRef.current) return;
    loadMoreInFlightRef.current = true;
    try {
      await load('append', false, nextCursor);
    } finally {
      loadMoreInFlightRef.current = false;
    }
  }, [hasMore, nextCursor, load]);

  return {
    articles,
    isLoading,
    isRefreshing,
    isLoadingMore,
    hasMore,
    feedGeneration,
    error,
    notice,
    usingDemoArticles,
    refresh,
    loadMore,
  };
}
