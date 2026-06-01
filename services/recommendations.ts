import {
  articleInterestKeywords,
  hasPersonalizationSignals,
} from '@/services/interestSignals';
import { formatInterestLabel } from '@/utils/interestKeywords';
import { Article, UserPreferences } from '@/types';

/** Broad topic likes — baseline signal. */
const TOPIC_WEIGHT = 1;
/** Outlet affinity — strong, specific signal. */
const SOURCE_WEIGHT = 2;
/** Title keyword overlap — finer-grained than topics. */
const KEYWORD_WEIGHT = 1.5;

function topicAffinityScore(article: Article, prefs: UserPreferences): number {
  return (
    article.topics.reduce((sum, topic) => sum + (prefs.topicScores[topic] ?? 0), 0) *
    TOPIC_WEIGHT
  );
}

function sourceAffinityScore(article: Article, prefs: UserPreferences): number {
  return (prefs.sourceScores[article.source] ?? 0) * SOURCE_WEIGHT;
}

function keywordAffinityScore(article: Article, prefs: UserPreferences): number {
  const keywords = articleInterestKeywords(article);
  const raw = keywords.reduce((sum, keyword) => sum + (prefs.keywordScores[keyword] ?? 0), 0);
  return raw * KEYWORD_WEIGHT;
}

export function articleAffinityScore(article: Article, prefs: UserPreferences): number {
  return (
    topicAffinityScore(article, prefs) +
    sourceAffinityScore(article, prefs) +
    keywordAffinityScore(article, prefs)
  );
}

export function rankArticles(
  articles: Article[],
  prefs: UserPreferences | null,
  likedIds: Set<string>,
): Article[] {
  if (!prefs || !hasPersonalizationSignals(prefs)) {
    return [...articles].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }

  return [...articles].sort((a, b) => {
    const scoreA = articleAffinityScore(a, prefs) + (likedIds.has(a.id) ? -1000 : 0);
    const scoreB = articleAffinityScore(b, prefs) + (likedIds.has(b.id) ? -1000 : 0);
    if (scoreB !== scoreA) return scoreB - scoreA;
    return new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime();
  });
}

export function hasLikedArticles(prefs: UserPreferences | null | undefined): boolean {
  return (prefs?.likedArticleIds.length ?? 0) > 0;
}

export function getPersonalizedFeed(articles: Article[], prefs: UserPreferences | null): Article[] {
  if (!hasLikedArticles(prefs)) {
    return [];
  }
  const likedIds = new Set(prefs!.likedArticleIds);
  return rankArticles(articles, prefs, likedIds);
}

function topScoredKeys(scores: Record<string, number>, limit: number): string[] {
  return Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([key]) => key);
}

export function getTopTopics(prefs: UserPreferences, limit = 3): string[] {
  return topScoredKeys(prefs.topicScores, limit);
}

export function getTopSources(prefs: UserPreferences, limit = 3): string[] {
  return topScoredKeys(prefs.sourceScores, limit);
}

export function getTopKeywords(prefs: UserPreferences, limit = 5): string[] {
  return topScoredKeys(prefs.keywordScores, limit);
}

/** Subtitle copy for For You — prefers narrow keywords/sources over broad topics. */
export function getPersonalizationSummary(prefs: UserPreferences | null, limit = 3): string {
  if (!prefs || !hasPersonalizationSignals(prefs)) {
    return 'Like articles to personalize your feed';
  }

  const labels = [
    ...getTopKeywords(prefs, 2).map(formatInterestLabel),
    ...getTopSources(prefs, 1),
    ...getTopTopics(prefs, 1).map(formatInterestLabel),
  ];

  const unique = [...new Set(labels)].slice(0, limit);
  if (unique.length === 0) return 'Like articles to personalize your feed';
  return `Based on your interest in ${unique.join(', ')}`;
}

export function findArticleById(articles: Article[], id: string): Article | undefined {
  return articles.find((a) => a.id === id);
}
