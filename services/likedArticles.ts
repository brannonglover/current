import { Article } from '@/types';

/** Trim stored snapshots — full body is loaded when opening the reader. */
export function likedArticleSnapshot(article: Article): Article {
  return { ...article, body: '' };
}

export function mergeLikedArticleSnapshot(
  cache: Record<string, Article>,
  article: Article,
): Record<string, Article> {
  return { ...cache, [article.id]: likedArticleSnapshot(article) };
}

export function removeLikedArticleSnapshot(
  cache: Record<string, Article>,
  articleId: string,
): Record<string, Article> {
  const next = { ...cache };
  delete next[articleId];
  return next;
}

/** Liked tab order: most recently liked first. */
export function resolveLikedArticles(
  likedArticleIds: string[],
  cache: Record<string, Article>,
  feedArticles: Article[],
): Article[] {
  const feedById = new Map(feedArticles.map((article) => [article.id, article]));
  const resolved: Article[] = [];

  for (let i = likedArticleIds.length - 1; i >= 0; i -= 1) {
    const id = likedArticleIds[i]!;
    const article = feedById.get(id) ?? cache[id];
    if (article) resolved.push(article);
  }

  return resolved;
}

export function missingLikedArticleIds(
  likedArticleIds: string[],
  cache: Record<string, Article>,
  feedArticles: Article[],
): string[] {
  const available = new Set([
    ...feedArticles.map((article) => article.id),
    ...Object.keys(cache),
  ]);
  return likedArticleIds.filter((id) => !available.has(id));
}
