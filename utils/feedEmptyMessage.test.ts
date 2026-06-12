import assert from 'node:assert/strict';
import test from 'node:test';

import {
  FOR_YOU_DEMO_NO_MATCHES_MESSAGE,
  FOR_YOU_NO_LIKES_MESSAGE,
  FOR_YOU_NO_MATCHES_MESSAGE,
  FOR_YOU_NO_PROFILE_MESSAGE,
  getForYouEmptyMessage,
} from './feedEmptyMessage';

test('getForYouEmptyMessage prompts to like when user has no likes', () => {
  assert.equal(
    getForYouEmptyMessage({
      totalCount: 100,
      filteredCount: 0,
      sourceFilteredCount: 80,
      hasLikedArticles: false,
    }),
    FOR_YOU_NO_LIKES_MESSAGE,
  );
});

test('getForYouEmptyMessage explains missing interest profile', () => {
  assert.equal(
    getForYouEmptyMessage({
      totalCount: 100,
      filteredCount: 0,
      sourceFilteredCount: 80,
      hasLikedArticles: true,
      hasInterestProfile: false,
    }),
    FOR_YOU_NO_PROFILE_MESSAGE,
  );
});

test('getForYouEmptyMessage explains demo catalog gap for TV likes', () => {
  assert.equal(
    getForYouEmptyMessage({
      totalCount: 8,
      filteredCount: 0,
      sourceFilteredCount: 3,
      hasLikedArticles: true,
      hasInterestProfile: true,
      usingDemoArticles: true,
    }),
    FOR_YOU_DEMO_NO_MATCHES_MESSAGE,
  );
});

test('getForYouEmptyMessage reports no matches when profile exists but feed is empty', () => {
  assert.equal(
    getForYouEmptyMessage({
      totalCount: 100,
      filteredCount: 0,
      sourceFilteredCount: 80,
      hasLikedArticles: true,
      hasInterestProfile: true,
    }),
    FOR_YOU_NO_MATCHES_MESSAGE,
  );
});
