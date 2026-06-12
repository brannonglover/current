import { forwardRef } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, View } from 'react-native';

import { ArticleFeed, ArticleFeedHandle, ArticleFeedLayout } from '@/components/ArticleFeed';
import { useTheme } from '@/hooks/useTheme';
import { Article } from '@/types';

interface ArticleFeedScreenProps {
  articles: Article[];
  title: string;
  subtitle?: string;
  titleTrailing?: React.ReactNode;
  emptyMessage?: string;
  isLoading?: boolean;
  isRefreshing?: boolean;
  error?: string | null;
  notice?: string | null;
  onRefresh?: () => void | Promise<void>;
  onLoadMore?: () => void;
  isLoadingMore?: boolean;
  loadMoreCursor?: number;
  headerExtra?: React.ReactNode;
  pendingCount?: number;
  pendingRefreshHint?: string;
  onApplyPending?: () => void | Promise<void>;
  onDismissPending?: () => void;
  layout?: ArticleFeedLayout;
  matchReasonsByArticleId?: Map<string, string[]>;
}

export const ArticleFeedScreen = forwardRef<ArticleFeedHandle, ArticleFeedScreenProps>(
  function ArticleFeedScreen(
    {
      articles,
      title,
      subtitle,
      titleTrailing,
      emptyMessage,
      isLoading,
      isRefreshing,
      error,
      notice,
      onRefresh,
      onLoadMore,
      isLoadingMore,
      loadMoreCursor,
      headerExtra,
      pendingCount = 0,
      pendingRefreshHint,
      onApplyPending,
      onDismissPending,
      layout,
      matchReasonsByArticleId,
    },
    ref,
  ) {
  const { colors } = useTheme();

  if (isLoading && articles.length === 0) {
    return (
      <View style={[styles.centered, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.text} />
      </View>
    );
  }

  return (
    <View style={styles.flex}>
      <ArticleFeed
        ref={ref}
        articles={articles}
        title={title}
        subtitle={subtitle}
        titleTrailing={titleTrailing}
        emptyMessage={emptyMessage}
        error={error}
        notice={notice}
        refreshControl={
          onRefresh ? (
            <RefreshControl
              refreshing={!!isRefreshing}
              onRefresh={onRefresh}
              tintColor={colors.text}
              colors={[colors.text]}
              progressBackgroundColor={colors.surface}
            />
          ) : undefined
        }
        headerExtra={headerExtra}
        pendingCount={pendingCount}
        pendingRefreshHint={pendingRefreshHint}
        onApplyPending={onApplyPending ?? onRefresh}
        onDismissPending={onDismissPending}
        onLoadMore={onLoadMore}
        isLoadingMore={isLoadingMore}
        loadMoreCursor={loadMoreCursor}
        layout={layout}
        matchReasonsByArticleId={matchReasonsByArticleId}
      />
    </View>
  );
  },
);

const styles = StyleSheet.create({
  flex: { flex: 1 },
  centered: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
