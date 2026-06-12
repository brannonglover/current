import { Article } from '@/types';

/** Pending stories that are not already in the live feed. */
export function pendingNotAlreadyInFeed(pending: Article[], articles: Article[]): Article[] {
  if (pending.length === 0) return pending;
  if (articles.length === 0) return pending;
  const seen = new Set(articles.map((article) => article.id));
  return pending.filter((article) => !seen.has(article.id));
}

export function hasActionablePending(pending: Article[], articles: Article[]): boolean {
  return pendingNotAlreadyInFeed(pending, articles).length > 0;
}
