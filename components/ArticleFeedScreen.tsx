import { forwardRef } from 'react';
import { ActivityIndicator, RefreshControl, StyleSheet, Text, View } from 'react-native';

import { ArticleFeed, ArticleFeedHandle } from '@/components/ArticleFeed';
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
  onRefresh?: () => void;
  headerExtra?: React.ReactNode;
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
      headerExtra,
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
      {error ? (
        <Text style={[styles.error, { color: colors.accent, backgroundColor: colors.background }]}>
          {error}
        </Text>
      ) : null}
      {notice ? (
        <Text style={[styles.notice, { color: colors.textSecondary, backgroundColor: colors.background }]}>
          {notice}
        </Text>
      ) : null}
      <ArticleFeed
        ref={ref}
        articles={articles}
        title={title}
        subtitle={subtitle}
        titleTrailing={titleTrailing}
        emptyMessage={emptyMessage}
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
  error: {
    fontFamily: 'Inter',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  notice: {
    fontFamily: 'Inter',
    fontSize: 12,
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
});
