/** True while the feed should show a spinner instead of the empty state. */
export function shouldShowArticleFeedLoading(options: {
  articleCount: number;
  isLoading: boolean;
  feedReady: boolean;
  persistedHydrated: boolean;
}): boolean {
  const { articleCount, isLoading, feedReady, persistedHydrated } = options;
  return articleCount === 0 && (isLoading || !feedReady || !persistedHydrated);
}
