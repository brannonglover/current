import assert from 'node:assert/strict';

import {
  detectRequiresSubscription,
  detectRequiresSubscriptionFromExtraction,
} from './subscription';

function run(label: string, fn: () => void) {
  try {
    fn();
    console.log(`ok ${label}`);
  } catch (error) {
    console.error(`fail ${label}`);
    throw error;
  }
}

run('accessRights subscription', () => {
  assert.equal(
    detectRequiresSubscription({
      title: 'Headline',
      excerpt: 'Short',
      body: 'Short body with enough words to avoid teaser-only path here still.',
      accessRights: 'subscription',
      feed: {},
    }),
    true,
  );
});

run('premium category', () => {
  assert.equal(
    detectRequiresSubscription({
      title: 'Headline',
      excerpt: 'Teaser',
      body: 'A'.repeat(200),
      categories: ['Premium'],
      feed: {},
    }),
    true,
  );
});

run('paywall phrase', () => {
  assert.equal(
    detectRequiresSubscription({
      title: 'Headline',
      excerpt: 'Subscribe to read the rest of this story.',
      body: '',
      feed: {},
    }),
    true,
  );
});

run('catalog flag alone does not mark', () => {
  assert.equal(
    detectRequiresSubscription({
      title: 'Headline',
      excerpt: 'A long excerpt that is clearly not a paywall teaser and goes on for a while.',
      body:
        'A full article body with plenty of words so heuristics should not fire just because the publisher is known for subscriptions sometimes but not always for every single article in the feed.',
      feed: { subscriptionPublisher: true },
    }),
    false,
  );
});

run('catalog + short teaser', () => {
  assert.equal(
    detectRequiresSubscription({
      title: 'Headline',
      excerpt: 'Brief teaser…',
      body: 'Brief teaser…',
      feed: { subscriptionPublisher: true },
    }),
    true,
  );
});

run('extraction thin + phrase', () => {
  assert.equal(
    detectRequiresSubscriptionFromExtraction(
      ['Subscribe to continue reading this report.'],
      { body: '', excerpt: 'Teaser' },
    ),
    true,
  );
});

console.log('subscription.detect tests passed');
