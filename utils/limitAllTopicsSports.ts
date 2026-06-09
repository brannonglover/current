import { articleSportTags } from '@/services/sportPreferences';
import { Article } from '@/types';
import { pickBestHeroImageAlternate } from '@/utils/articleStoryMatch';
import {
  findHotTrendingCandidates,
  HotTrendingCandidate,
} from '@/utils/trendingArticles';

/** Max hot-trending sports stories per league/sport facet on the All-topics feed. */
export const ALL_TOPICS_SPORTS_PER_TAG_LIMIT = 2;

/** Safety cap on sports rows when many leagues are hot at once. */
export const ALL_TOPICS_SPORTS_TOTAL_LIMIT = 8;

function isSportsArticle(article: Article): boolean {
  return article.topics.includes('sports');
}

function sportTagBucket(article: Article): string {
  const tags = articleSportTags(article);
  return tags[0] ?? 'general';
}

function compareTrendingStrength(a: HotTrendingCandidate, b: HotTrendingCandidate): number {
  const burstDiff = b.burstCount - a.burstCount;
  if (burstDiff !== 0) return burstDiff;

  const best = pickBestHeroImageAlternate([a.article, b.article]);
  if (best.id === a.article.id) return -1;
  if (best.id === b.article.id) return 1;
  return 0;
}

/**
 * On the main (All topics) feed, keep only the strongest trending sports stories.
 * Non-sports articles pass through unchanged. Sport/topic filters bypass this path.
 */
export function limitSportsInAllTopicsFeed(
  articles: Article[],
  nowMs: number = Date.now(),
): Article[] {
  const sports = articles.filter(isSportsArticle);
  if (sports.length === 0) return articles;

  const hotById = new Map(
    findHotTrendingCandidates(articles, nowMs).map((candidate) => [
      candidate.article.id,
      candidate,
    ]),
  );

  const hotSports = sports.filter((article) => hotById.has(article.id));
  if (hotSports.length === 0) {
    return articles.filter((article) => !isSportsArticle(article));
  }

  const perTagKept: Article[] = [];
  const byTag = new Map<string, Article[]>();

  for (const article of hotSports) {
    const tag = sportTagBucket(article);
    const bucket = byTag.get(tag);
    if (bucket) bucket.push(article);
    else byTag.set(tag, [article]);
  }

  for (const bucket of byTag.values()) {
    const ranked = bucket
      .map((article) => hotById.get(article.id)!)
      .sort(compareTrendingStrength)
      .slice(0, ALL_TOPICS_SPORTS_PER_TAG_LIMIT)
      .map((candidate) => candidate.article);
    perTagKept.push(...ranked);
  }

  const keptIds = new Set(
    perTagKept
      .map((article) => hotById.get(article.id)!)
      .sort(compareTrendingStrength)
      .slice(0, ALL_TOPICS_SPORTS_TOTAL_LIMIT)
      .map((candidate) => candidate.article.id),
  );

  return articles.filter((article) => !isSportsArticle(article) || keptIds.has(article.id));
}
