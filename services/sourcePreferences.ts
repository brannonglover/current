import { Article, FeedSource, Topic } from '@/types';

/** Empty enabledSourceIds means all sources are on */
export function isAllSourcesEnabled(enabledSourceIds: string[]): boolean {
  return enabledSourceIds.length === 0;
}

export function getEnabledSourceIds(
  sources: FeedSource[],
  enabledSourceIds: string[],
): string[] {
  if (isAllSourcesEnabled(enabledSourceIds)) {
    return sources.map((s) => s.id);
  }
  return enabledSourceIds.filter((id) => sources.some((s) => s.id === id));
}

export function getEnabledSourceNames(
  sources: FeedSource[],
  enabledSourceIds: string[],
): Set<string> {
  const ids = new Set(getEnabledSourceIds(sources, enabledSourceIds));
  return new Set(sources.filter((s) => ids.has(s.id)).map((s) => s.name));
}

export function filterArticlesBySources(
  articles: Article[],
  sources: FeedSource[],
  enabledSourceIds: string[],
): Article[] {
  const names = getEnabledSourceNames(sources, enabledSourceIds);
  return articles.filter((article) => names.has(article.source));
}

export function countEnabledSources(
  sources: FeedSource[],
  enabledSourceIds: string[],
): number {
  return getEnabledSourceIds(sources, enabledSourceIds).length;
}

/** Maps outlet display name (article.source) to its catalog primary curiosity. */
export function buildSourcePrimaryTopicMap(sources: FeedSource[]): Map<string, Topic> {
  const map = new Map<string, Topic>();
  for (const source of sources) {
    const primary = source.primaryTopic ?? source.topics[0];
    if (primary) map.set(source.name, primary);
  }
  return map;
}
