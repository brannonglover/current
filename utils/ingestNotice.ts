export const PENDING_INGEST_NOTICE = 'Fetching latest stories…';

type IngestNoticeLoadMode = 'initial' | 'refresh' | 'silent' | 'append';

/** Only show the ingest banner when the user has no stories to read yet. */
export function ingestNoticeForFetch(options: {
  ingestPending: boolean;
  mode: IngestNoticeLoadMode;
  persistedArticleCount: number;
  fetchedArticleCount: number;
}): string | null {
  const { ingestPending, mode, persistedArticleCount, fetchedArticleCount } = options;
  if (!ingestPending || mode === 'append') return null;

  const hasDisplayableArticles =
    mode === 'silent'
      ? persistedArticleCount > 0 || fetchedArticleCount > 0
      : fetchedArticleCount > 0;

  return hasDisplayableArticles ? null : PENDING_INGEST_NOTICE;
}
