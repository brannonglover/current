import { Article } from '@/types';

/** In-memory snapshot so an open article stays readable if the feed/API list changes. */
const openArticles = new Map<string, Article>();

export function rememberOpenArticle(article: Article): void {
  openArticles.set(article.id, article);
}

export function getRememberedArticle(id: string): Article | undefined {
  return openArticles.get(id);
}
