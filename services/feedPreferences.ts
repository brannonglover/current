import { SPORT_TAG_ORDER } from '@/catalog/sports';
import { CURIOSITY_ORDER } from '@/constants/curiosities';
import { SportTag, Topic, UserPreferences } from '@/types';

import { isSportsTopicActive } from './sportPreferences';
import { isAllTopicsEnabled } from './topicPreferences';

const VALID_TOPICS = new Set<Topic>(CURIOSITY_ORDER);
const VALID_SPORT_TAGS = new Set<SportTag>(SPORT_TAG_ORDER);

function uniqueTopics(topics: Topic[]): Topic[] {
  const seen = new Set<Topic>();
  const out: Topic[] = [];
  for (const topic of topics) {
    if (seen.has(topic)) continue;
    seen.add(topic);
    out.push(topic);
  }
  return out;
}

function uniqueSportTags(tags: SportTag[]): SportTag[] {
  const seen = new Set<SportTag>();
  const out: SportTag[] = [];
  for (const tag of tags) {
    if (seen.has(tag)) continue;
    seen.add(tag);
    out.push(tag);
  }
  return out;
}

function sameStringArray(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((value, index) => value === b[index]);
}

/** Repair persisted topic/sport filters so "All topics" and non-sports topics behave correctly. */
export function normalizeFeedPreferences(prefs: UserPreferences): UserPreferences {
  const rawTopics = Array.isArray(prefs.enabledTopics) ? prefs.enabledTopics : [];
  const rawSportTags = Array.isArray(prefs.enabledSportTags) ? prefs.enabledSportTags : [];

  let enabledTopics = uniqueTopics(
    rawTopics.filter((topic): topic is Topic => VALID_TOPICS.has(topic as Topic)),
  );
  let enabledSportTags = uniqueSportTags(
    rawSportTags.filter((tag): tag is SportTag => VALID_SPORT_TAGS.has(tag as SportTag)),
  );

  if (isAllTopicsEnabled(enabledTopics) || !isSportsTopicActive(enabledTopics)) {
    enabledSportTags = [];
  }

  if (
    sameStringArray(enabledTopics, prefs.enabledTopics) &&
    sameStringArray(enabledSportTags, prefs.enabledSportTags)
  ) {
    return prefs;
  }

  return { ...prefs, enabledTopics, enabledSportTags };
}
