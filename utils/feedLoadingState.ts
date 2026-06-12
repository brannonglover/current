/** True while the feed should show a spinner instead of the empty state. */
export function shouldShowArticleFeedLoading(options: {
  articleCount: number;
  isLoading: boolean;
  feedReady: boolean;
  persistedHydrated: boolean;
  awaitingBackgroundFeed?: boolean;
}): boolean {
  const { articleCount, isLoading, feedReady, persistedHydrated, awaitingBackgroundFeed } =
    options;
  if (articleCount > 0) return false;
  return (
    isLoading || !feedReady || !persistedHydrated || awaitingBackgroundFeed === true
  );
}
