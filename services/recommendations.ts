import { SPORT_TAG_LABELS } from '@/catalog/sports';
import { CURIOSITY_LABELS } from '@/constants/curiosities';
import {
  articleInterestKeywords,
  buildLikedInterestProfile,
  hasInterestSignals,
  LikedInterestProfile,
} from '@/services/interestSignals';
import { articleSportTags } from '@/services/sportPreferences';
import {
  formatInterestLabel,
  getInterestKeywordWeight,
  getKeywordTier,
  isSpecificInterestKeyword,
  PRIMARY_INTEREST_KEYWORDS,
  SECONDARY_INTEREST_KEYWORDS,
} from '@/utils/interestKeywords';
import { Article, SportTag, Topic, UserPreferences } from '@/types';

/** Broad topic likes — baseline signal. */
const TOPIC_WEIGHT = 1;
/** Title keyword overlap — captures show names, themes, and headline vocabulary. */
const KEYWORD_WEIGHT = 2;
/** Sport/league affinity — finer-grained than the sports topic alone. */
const SPORT_TAG_WEIGHT = 1.5;
/** Repeated likes in the same topic — strong signal on its own. */
const MIN_TOPIC_ONLY_AFFINITY = 2;
/** Broad topics — single-like users need keyword or sport-tag overlap, not topic alone. */
const BROAD_TOPICS = new Set<Topic>(['business', 'culture', 'sports', 'technology', 'world']);

/** Equivalent terms for profile ↔ headline matching (e.g. television ↔ tv). */
const INTEREST_KEYWORD_ALIASES: Record<string, string[]> = {
  tv: ['television'],
  television: ['tv'],
  show: ['series'],
  series: ['show'],
  movie: ['film', 'cinema'],
  film: ['movie', 'cinema'],
  cinema: ['movie', 'film'],
};

type InterestScores = Pick<UserPreferences, 'topicScores' | 'keywordScores' | 'sportTagScores'>;

function topicAffinityScore(article: Article, profile: InterestScores): number {
  return (
    article.topics.reduce((sum, topic) => sum + (profile.topicScores[topic] ?? 0), 0) *
    TOPIC_WEIGHT
  );
}

function keywordMatchesInText(keyword: string, text: string): boolean {
  const escaped = keyword.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  return new RegExp(`\\b${escaped}\\b`).test(text);
}

function keywordMatchesArticle(
  keyword: string,
  articleKeywords: Set<string>,
  text: string,
): boolean {
  if (!isSpecificInterestKeyword(keyword)) return false;
  if (articleKeywords.has(keyword)) return true;

  const terms = [keyword, ...(INTEREST_KEYWORD_ALIASES[keyword] ?? [])];
  if (
    PRIMARY_INTEREST_KEYWORDS.has(keyword) ||
    SECONDARY_INTEREST_KEYWORDS.has(keyword) ||
    terms.length > 1
  ) {
    if (terms.some((term) => keywordMatchesInText(term, text))) return true;
  }

  // Substring match for headline vocabulary (e.g. "championship" ↔ "championships").
  if (keyword.length < 4) return false;
  return text.includes(keyword);
}

function keywordAffinityScore(article: Article, profile: InterestScores): number {
  const text = `${article.title} ${article.excerpt}`.toLowerCase();
  const articleKeywords = new Set(articleInterestKeywords(article));
  let raw = 0;
  for (const [keyword, score] of Object.entries(profile.keywordScores)) {
    if (score <= 0) continue;
    if (keywordMatchesArticle(keyword, articleKeywords, text)) raw += score;
  }
  return raw * KEYWORD_WEIGHT;
}

function sportTagAffinityScore(article: Article, profile: InterestScores): number {
  const tags = articleSportTags(article);
  const raw = tags.reduce((sum, tag) => sum + (profile.sportTagScores?.[tag] ?? 0), 0);
  return raw * SPORT_TAG_WEIGHT;
}

export function articleAffinityScore(article: Article, profile: InterestScores): number {
  return (
    topicAffinityScore(article, profile) +
    keywordAffinityScore(article, profile) +
    sportTagAffinityScore(article, profile)
  );
}

function hasNarrowTopicOverlap(article: Article, profile: InterestScores): boolean {
  for (const topic of article.topics) {
    if (BROAD_TOPICS.has(topic)) continue;
    if ((profile.topicScores[topic] ?? 0) > 0) return true;
  }
  return false;
}

/** Whether a candidate article meaningfully overlaps liked-article interests. */
export function isMeaningfulInterestMatch(article: Article, profile: InterestScores): boolean {
  const keywordScore = keywordAffinityScore(article, profile);
  const sportScore = sportTagAffinityScore(article, profile);
  const topicScore = topicAffinityScore(article, profile);
  return (
    keywordScore > 0 ||
    sportScore > 0 ||
    topicScore >= MIN_TOPIC_ONLY_AFFINITY ||
    hasNarrowTopicOverlap(article, profile)
  );
}

export function rankArticles(
  articles: Article[],
  profile: LikedInterestProfile | null,
  likedIds: Set<string>,
): Article[] {
  if (!profile || !hasInterestSignals(profile)) {
    return [...articles].sort(
      (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
    );
  }

  return [...articles].sort((a, b) => {
    const scoreA = articleAffinityScore(a, profile) + (likedIds.has(a.id) ? -1000 : 0);
    const scoreB = articleAffinityScore(b, profile) + (likedIds.has(b.id) ? -1000 : 0);
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

  const profileArticles = [
    ...articles,
    ...Object.values(prefs!.likedArticles ?? {}),
  ];
  const profile = buildLikedInterestProfile(prefs!, profileArticles);
  if (!profile || !hasInterestSignals(profile)) {
    return [];
  }

  const likedIds = new Set(prefs!.likedArticleIds);
  const discoverable = articles.filter((article) => !likedIds.has(article.id));
  const matches = discoverable.filter((article) => isMeaningfulInterestMatch(article, profile));
  return rankArticles(matches, profile, likedIds);
}

function topScoredKeys(scores: Record<string, number>, limit: number): string[] {
  return Object.entries(scores)
    .filter(([, score]) => score > 0)
    .sort(([, a], [, b]) => b - a)
    .slice(0, limit)
    .map(([key]) => key);
}

export function getTopTopics(profile: InterestScores, limit = 3): string[] {
  return topScoredKeys(profile.topicScores, limit);
}

export function getTopKeywords(profile: InterestScores, limit = 5): string[] {
  return topScoredKeys(profile.keywordScores, limit);
}

export function getTopSportTags(profile: InterestScores, limit = 3): SportTag[] {
  return topScoredKeys(profile.sportTagScores ?? {}, limit) as SportTag[];
}

export type LikedInterestBadgeKind = 'topic' | 'keyword' | 'sport';

export interface LikedInterestBadgeItem {
  kind: LikedInterestBadgeKind;
  key: string;
  label: string;
}

/** Badge chips for For You — mirrors buildLikedInterestProfile matching signals. */
export function getLikedInterestBadgeItems(profile: InterestScores): LikedInterestBadgeItem[] {
  const items: LikedInterestBadgeItem[] = [];

  for (const topic of topScoredKeys(profile.topicScores, Number.POSITIVE_INFINITY)) {
    items.push({
      kind: 'topic',
      key: topic,
      label: CURIOSITY_LABELS[topic as Topic] ?? formatInterestLabel(topic),
    });
  }

  for (const keyword of topScoredKeys(profile.keywordScores, Number.POSITIVE_INFINITY)) {
    if (!isSpecificInterestKeyword(keyword)) continue;
    items.push({
      kind: 'keyword',
      key: keyword,
      label: formatInterestLabel(keyword),
    });
  }

  for (const tag of topScoredKeys(profile.sportTagScores ?? {}, Number.POSITIVE_INFINITY)) {
    items.push({
      kind: 'sport',
      key: tag,
      label: formatSportTagLabel(tag),
    });
  }

  return items;
}

function formatSportTagLabel(tag: string): string {
  return SPORT_TAG_LABELS[tag as SportTag] ?? formatInterestLabel(tag);
}

/** Per-article match chips for For You — which liked-interest signals matched this story. */
export function getArticleMatchReasons(
  article: Article,
  profile: InterestScores,
  limit = 3,
): string[] {
  const text = `${article.title} ${article.excerpt}`.toLowerCase();
  const articleKeywords = new Set(articleInterestKeywords(article));
  const reasons: { label: string; weight: number }[] = [];

  for (const [keyword, score] of Object.entries(profile.keywordScores)) {
    if (score <= 0) continue;
    if (getKeywordTier(keyword) === 'other') continue;
    if (!keywordMatchesArticle(keyword, articleKeywords, text)) continue;
    reasons.push({
      label: formatInterestLabel(keyword),
      weight: score * getInterestKeywordWeight(keyword),
    });
  }

  for (const tag of articleSportTags(article)) {
    const score = profile.sportTagScores?.[tag] ?? 0;
    if (score <= 0) continue;
    reasons.push({
      label: formatSportTagLabel(tag),
      weight: score * SPORT_TAG_WEIGHT,
    });
  }

  return [...reasons]
    .sort((a, b) => b.weight - a.weight)
    .slice(0, limit)
    .map((reason) => reason.label);
}

export function buildArticleMatchReasonsById(
  articles: Article[],
  profile: InterestScores | null,
): Map<string, string[]> {
  const map = new Map<string, string[]>();
  if (!profile || !hasInterestSignals(profile)) return map;

  for (const article of articles) {
    const reasons = getArticleMatchReasons(article, profile);
    if (reasons.length > 0) {
      map.set(article.id, reasons);
    }
  }

  return map;
}

/** Subtitle copy for For You — prefers narrow keywords and sport tags over broad topics. */
export function getPersonalizationSummary(prefs: UserPreferences | null, limit = 3): string {
  const profile = prefs ? buildLikedInterestProfile(prefs) : null;
  if (!profile || !hasInterestSignals(profile)) {
    return 'Like articles to personalize your feed';
  }

  const labels = [
    ...getTopKeywords(profile, 2).map(formatInterestLabel),
    ...getTopSportTags(profile, 1).map(formatSportTagLabel),
    ...getTopTopics(profile, 1).map(formatInterestLabel),
  ];

  const unique = [...new Set(labels)].slice(0, limit);
  if (unique.length === 0) return 'Like articles to personalize your feed';
  return `Based on your interest in ${unique.join(', ')}`;
}

export function findArticleById(articles: Article[], id: string): Article | undefined {
  return articles.find((a) => a.id === id);
}
