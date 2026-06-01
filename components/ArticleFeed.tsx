import { Ionicons } from '@expo/vector-icons';
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react';
import {
  FlatList,
  LayoutChangeEvent,
  NativeScrollEvent,
  NativeSyntheticEvent,
  PixelRatio,
  RefreshControlProps,
  ScrollView,
  StyleSheet,
  Text,
  View,
  ViewToken,
} from 'react-native';
import Animated, {
  Easing,
  runOnJS,
  scrollTo,
  useAnimatedRef,
  useAnimatedReaction,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated';

import { ArticleCard } from '@/components/ArticleCard';
import { FeedBottomVignette } from '@/components/FeedBottomVignette';
import { FeedHeader } from '@/components/FeedHeader';
import { FEED_SCROLL_PEEK_RATIO } from '@/constants/Layout';
import { useTheme } from '@/hooks/useTheme';
import { Article } from '@/types';

const AnimatedFlatList = Animated.createAnimatedComponent(FlatList<Article>);

interface ArticleFeedProps {
  articles: Article[];
  title: string;
  subtitle?: string;
  titleTrailing?: React.ReactNode;
  emptyMessage?: string;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  headerExtra?: React.ReactNode;
}

export interface ArticleFeedHandle {
  scrollToTop: () => Promise<void>;
}

function normalizeHeight(height: number) {
  return PixelRatio.roundToNearestPixel(height);
}

function getSnapMetrics(pageHeight: number) {
  const peekPx = Math.max(12, Math.round(pageHeight * FEED_SCROLL_PEEK_RATIO));
  const snapHeight = normalizeHeight(pageHeight - peekPx);
  return { peekPx, snapHeight };
}

export const ArticleFeed = forwardRef<ArticleFeedHandle, ArticleFeedProps>(function ArticleFeed(
  { articles, title, subtitle, titleTrailing, emptyMessage, refreshControl, headerExtra },
  ref,
) {
  const { colors } = useTheme();
  const [pageHeight, setPageHeight] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const [freeScroll, setFreeScroll] = useState(false);
  const activeIndexRef = useRef(0);
  const isAnimatingToTopRef = useRef(false);
  const pendingScrollToTopRef = useRef(false);
  const scrollCompleteRef = useRef<(() => void) | null>(null);
  const listRef = useAnimatedRef<FlatList<Article>>();
  const emptyScrollRef = useRef<ScrollView>(null);
  const scrollY = useSharedValue(0);
  const isAnimatingScroll = useSharedValue(false);

  const onListLayout = useCallback((e: LayoutChangeEvent) => {
    setPageHeight(normalizeHeight(e.nativeEvent.layout.height));
  }, []);

  const onViewableItemsChanged = useRef(
    ({ viewableItems }: { viewableItems: ViewToken[] }) => {
      if (isAnimatingToTopRef.current) return;
      if (viewableItems.length > 0 && viewableItems[0].index != null) {
        activeIndexRef.current = viewableItems[0].index;
        setActiveIndex(viewableItems[0].index);
      }
    },
  );

  const updateActiveIndexFromOffset = useCallback(
    (offsetY: number) => {
      if (pageHeight <= 0) return;
      const { snapHeight } = getSnapMetrics(pageHeight);
      const index = Math.max(0, Math.round(offsetY / snapHeight));
      if (index !== activeIndexRef.current) {
        activeIndexRef.current = index;
        setActiveIndex(index);
      }
    },
    [pageHeight],
  );

  const finishScrollToTop = useCallback(() => {
    isAnimatingToTopRef.current = false;
    isAnimatingScroll.value = false;
    pendingScrollToTopRef.current = false;
    setFreeScroll(false);
    activeIndexRef.current = 0;
    setActiveIndex(0);
    scrollCompleteRef.current?.();
    scrollCompleteRef.current = null;
  }, [isAnimatingScroll]);

  const scrollToTop = useCallback(() => {
    if (articles.length === 0) {
      emptyScrollRef.current?.scrollTo({ y: 0, animated: true });
      return Promise.resolve();
    }

    if (activeIndexRef.current === 0 && !isAnimatingToTopRef.current) {
      return Promise.resolve();
    }

    if (isAnimatingToTopRef.current || pendingScrollToTopRef.current) {
      return Promise.resolve();
    }

    return new Promise<void>((resolve) => {
      scrollCompleteRef.current = resolve;
      pendingScrollToTopRef.current = true;
      setFreeScroll(true);
    });
  }, [articles.length]);

  useEffect(() => {
    if (!freeScroll || !pendingScrollToTopRef.current || pageHeight <= 0) return;

    pendingScrollToTopRef.current = false;
    isAnimatingToTopRef.current = true;

    const { snapHeight } = getSnapMetrics(pageHeight);
    const startIndex = activeIndexRef.current;
    const startOffset = startIndex * snapHeight;
    const duration = Math.min(700, 300 + startIndex * 55);

    scrollY.value = startOffset;
    isAnimatingScroll.value = true;

    scrollY.value = withTiming(
      0,
      { duration, easing: Easing.out(Easing.cubic) },
      (finished) => {
        if (finished) {
          runOnJS(finishScrollToTop)();
        }
      },
    );
  }, [freeScroll, pageHeight, finishScrollToTop, scrollY, isAnimatingScroll]);

  useAnimatedReaction(
    () => scrollY.value,
    (y) => {
      if (!isAnimatingScroll.value) return;
      scrollTo(listRef, 0, y, false);
    },
  );

  const onScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      if (!isAnimatingToTopRef.current) return;
      updateActiveIndexFromOffset(event.nativeEvent.contentOffset.y);
    },
    [updateActiveIndexFromOffset],
  );

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 });
  const canPullToRefresh = activeIndex === 0 && !!refreshControl && !freeScroll;
  const snapMetrics = pageHeight > 0 ? getSnapMetrics(pageHeight) : null;
  const hasMoreBelow = activeIndex < articles.length - 1;

  useImperativeHandle(ref, () => ({ scrollToTop }), [scrollToTop]);

  if (articles.length === 0) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <FeedHeader title={title} subtitle={subtitle} titleTrailing={titleTrailing} />
        {headerExtra}
        <ScrollView
          ref={emptyScrollRef}
          style={styles.emptyBody}
          contentContainerStyle={
            headerExtra ? styles.emptyScrollContentAnchored : styles.emptyScrollContentCentered
          }
          refreshControl={refreshControl}
          alwaysBounceVertical={!!refreshControl}>
          {headerExtra ? (
            <View style={styles.emptyStateAnchored}>
              <View style={[styles.emptyIconWrap, { backgroundColor: colors.surface }]}>
                <Ionicons name="heart-outline" size={28} color={colors.textSecondary} />
              </View>
              <Text style={[styles.emptyTextAnchored, { color: colors.textSecondary }]}>
                {emptyMessage ?? 'No articles yet.'}
              </Text>
            </View>
          ) : (
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              {emptyMessage ?? 'No articles yet.'}
            </Text>
          )}
        </ScrollView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <FeedHeader title={title} subtitle={subtitle} titleTrailing={titleTrailing} />
      {headerExtra}
      <View style={styles.listWrap} onLayout={onListLayout}>
        {pageHeight > 0 && snapMetrics && (
          <AnimatedFlatList
            ref={listRef}
            data={articles}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <ArticleCard article={item} height={snapMetrics.snapHeight} />
            )}
            style={[styles.list, { height: pageHeight, zIndex: 0 }]}
            showsVerticalScrollIndicator={false}
            pagingEnabled={false}
            snapToInterval={!freeScroll ? snapMetrics.snapHeight : undefined}
            snapToAlignment="start"
            disableIntervalMomentum
            decelerationRate="fast"
            bounces={canPullToRefresh}
            alwaysBounceVertical={canPullToRefresh}
            overScrollMode={canPullToRefresh ? 'always' : 'never'}
            removeClippedSubviews={false}
            refreshControl={refreshControl}
            scrollEventThrottle={16}
            onScroll={onScroll}
            onViewableItemsChanged={onViewableItemsChanged.current}
            viewabilityConfig={viewabilityConfig.current}
            getItemLayout={(_, index) => ({
              length: snapMetrics.snapHeight,
              offset: snapMetrics.snapHeight * index,
              index,
            })}
          />
        )}
        {pageHeight > 0 && hasMoreBelow && <FeedBottomVignette />}
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listWrap: {
    flex: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  list: {
    flexGrow: 0,
  },
  emptyBody: {
    flex: 1,
  },
  emptyScrollContentCentered: {
    flexGrow: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emptyScrollContentAnchored: {
    flexGrow: 1,
    paddingHorizontal: 24,
    paddingTop: 48,
  },
  emptyStateAnchored: {
    alignItems: 'center',
    gap: 16,
  },
  emptyIconWrap: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    textAlign: 'center',
  },
  emptyTextAnchored: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    maxWidth: 300,
  },
});
