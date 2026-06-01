import { Article } from '@/types';

import { orderLatestFeed } from '@/utils/feedOrdering';

/** @deprecated Prefer orderLatestFeed from @/utils/feedOrdering */
export function diversifyFeedBySource(articles: Article[]): Article[] {
  return orderLatestFeed(articles);
}
