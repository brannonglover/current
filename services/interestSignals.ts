import { extractInterestKeywords } from '@/utils/interestKeywords';
import { Article, Topic, UserPreferences } from '@/types';

export const LIKE_BOOST = 1;

function adjustScoreMap(
  scores: Record<string, number>,
  keys: string[],
  delta: number,
): Record<string, number> {
  const next = { ...scores };
  for (const key of keys) {
    const current = next[key] ?? 0;
    const updated = current + delta;
    if (updated <= 0) {
      delete next[key];
    } else {
      next[key] = updated;
    }
  }
  return next;
}

export function articleInterestKeywords(article: Article): string[] {
  return extractInterestKeywords(`${article.title} ${article.excerpt}`);
}

export function applyArticleLikeSignals(
  preferences: UserPreferences,
  article: Article,
  currentlyLiked: boolean,
): Pick<UserPreferences, 'topicScores' | 'sourceScores' | 'keywordScores'> {
  const delta = currentlyLiked ? -LIKE_BOOST : LIKE_BOOST;

  const topicScores = { ...preferences.topicScores };
  for (const topic of article.topics) {
    const current = topicScores[topic as Topic] ?? 0;
    const updated = current + delta;
    topicScores[topic as Topic] = Math.max(0, updated);
  }

  const sourceScores = adjustScoreMap(preferences.sourceScores, [article.source], delta);
  const keywordScores = adjustScoreMap(
    preferences.keywordScores,
    articleInterestKeywords(article),
    delta,
  );

  return { topicScores, sourceScores, keywordScores };
}

export function hasPersonalizationSignals(prefs: UserPreferences): boolean {
  if (Object.values(prefs.topicScores).some((score) => score > 0)) return true;
  if (Object.values(prefs.sourceScores).some((score) => score > 0)) return true;
  if (Object.values(prefs.keywordScores).some((score) => score > 0)) return true;
  return false;
}
