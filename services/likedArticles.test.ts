import test from 'node:test';
import assert from 'node:assert/strict';

import { Article } from '@/types';

import {
  mergeLikedArticleSnapshot,
  missingLikedArticleIds,
  resolveLikedArticles,
} from './likedArticles';

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

test('resolveLikedArticles prefers feed data and newest-first order', () => {
  const feed = [article('a'), article('b')];
  const cache = { c: article('c') };
  const resolved = resolveLikedArticles(['a', 'c', 'b'], cache, feed);

  assert.deepEqual(
    resolved.map((item) => item.id),
    ['b', 'c', 'a'],
  );
  assert.equal(resolved[0]?.body, 'Body text');
});

test('mergeLikedArticleSnapshot strips body from cache', () => {
  const cache = mergeLikedArticleSnapshot({}, article('x'));
  assert.equal(cache.x?.body, '');
  assert.equal(cache.x?.title, 'Title x');
});

test('missingLikedArticleIds finds ids not in feed or cache', () => {
  const missing = missingLikedArticleIds(['a', 'b', 'c'], { a: article('a') }, [article('b')]);
  assert.deepEqual(missing, ['c']);
});
