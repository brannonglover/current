import assert from 'node:assert/strict';
import test from 'node:test';

import { CURIOSITY_ORDER } from '@/constants/curiosities';
import { Article, UserPreferences } from '@/types';
import { isTrendingNotificationRelevant } from '@/utils/trendingNotificationInterest';

function basePrefs(overrides: Partial<UserPreferences> = {}): UserPreferences {
  return {
    likedArticleIds: [],
    topicScores: Object.fromEntries(CURIOSITY_ORDER.map((t) => [t, 0])) as UserPreferences['topicScores'],
    sourceScores: {},
    keywordScores: {},
    enabledSourceIds: [],
    enabledTopics: [],
    enabledSportTags: [],
    trendingNotificationsEnabled: true,
    folders: [],
    ...overrides,
  };
}

function article(topics: UserPreferences['topicScores'] extends Record<infer K, number> ? K[] : never): Article {
  return {
    id: 'a1',
    title: 'Story',
    excerpt: 'excerpt',
    body: 'body',
    source: 'Wire',
    imageUrl: 'https://example.com/1.jpg',
    topics,
    readTimeMinutes: 3,
    publishedAt: new Date().toISOString(),
    url: 'https://example.com/a1',
  };
}

test('isTrendingNotificationRelevant requires affinity when user has like signals', () => {
  const prefs = basePrefs({
    topicScores: { ...basePrefs().topicScores, technology: 2 },
  });

  assert.equal(isTrendingNotificationRelevant(article(['technology']), prefs), true);
  assert.equal(isTrendingNotificationRelevant(article(['politics']), prefs), false);
});

test('isTrendingNotificationRelevant allows narrowed topic filters without likes', () => {
  const prefs = basePrefs({ enabledTopics: ['science'] });
  assert.equal(isTrendingNotificationRelevant(article(['science']), prefs), true);
});

test('isTrendingNotificationRelevant rejects all-topics feed with no personalization', () => {
  const prefs = basePrefs();
  assert.equal(isTrendingNotificationRelevant(article(['world']), prefs), false);
});
