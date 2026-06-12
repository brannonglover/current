import assert from 'node:assert/strict';
import test from 'node:test';

import { shouldShowArticleFeedLoading } from './feedLoadingState';

test('shouldShowArticleFeedLoading stays true until hydration and fetch settle', () => {
  assert.equal(
    shouldShowArticleFeedLoading({
      articleCount: 0,
      isLoading: true,
      feedReady: false,
      persistedHydrated: false,
    }),
    true,
  );

  assert.equal(
    shouldShowArticleFeedLoading({
      articleCount: 0,
      isLoading: false,
      feedReady: true,
      persistedHydrated: false,
    }),
    true,
  );

  assert.equal(
    shouldShowArticleFeedLoading({
      articleCount: 0,
      isLoading: false,
      feedReady: false,
      persistedHydrated: true,
    }),
    true,
  );
});

test('shouldShowArticleFeedLoading stays true while background ingest is pending', () => {
  assert.equal(
    shouldShowArticleFeedLoading({
      articleCount: 0,
      isLoading: false,
      feedReady: true,
      persistedHydrated: true,
      awaitingBackgroundFeed: true,
    }),
    true,
  );
});

test('shouldShowArticleFeedLoading is false when cached articles are available', () => {
  assert.equal(
    shouldShowArticleFeedLoading({
      articleCount: 12,
      isLoading: false,
      feedReady: true,
      persistedHydrated: true,
    }),
    false,
  );

  assert.equal(
    shouldShowArticleFeedLoading({
      articleCount: 5,
      isLoading: false,
      feedReady: false,
      persistedHydrated: false,
    }),
    false,
  );
});
