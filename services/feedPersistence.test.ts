import test from 'node:test';
import assert from 'node:assert/strict';

import { Article } from '@/types';

import { MAX_FEED_SNAPSHOT_ARTICLES, trimFeedSnapshot } from './feedPersistence';

function article(id: string): Article {
  return {
    id,
    title: `Title ${id}`,
    excerpt: 'Excerpt',
    body: 'Body text',
    source: 'Test',
    imageUrl: 'https://example.com/img.jpg',
    topics: ['world'],
    readTimeMinutes: 3,
    publishedAt: '2026-06-01T12:00:00.000Z',
    url: `https://example.com/${id}`,
  };
}

test('trimFeedSnapshot strips body and caps article count', () => {
  const articles = Array.from({ length: MAX_FEED_SNAPSHOT_ARTICLES + 10 }, (_, i) =>
    article(String(i)),
  );
  const trimmed = trimFeedSnapshot(articles);

  assert.equal(trimmed.length, MAX_FEED_SNAPSHOT_ARTICLES);
  assert.equal(trimmed[0]?.body, '');
  assert.equal(trimmed[0]?.title, 'Title 0');
  assert.equal(trimmed[MAX_FEED_SNAPSHOT_ARTICLES - 1]?.id, String(MAX_FEED_SNAPSHOT_ARTICLES - 1));
});
