import test from 'node:test';
import assert from 'node:assert/strict';

import { ingestNoticeForFetch, PENDING_INGEST_NOTICE } from './ingestNotice';

test('shows ingest notice only when the feed is empty', () => {
  assert.equal(
    ingestNoticeForFetch({
      ingestPending: true,
      mode: 'initial',
      persistedArticleCount: 0,
      fetchedArticleCount: 0,
    }),
    PENDING_INGEST_NOTICE,
  );

  assert.equal(
    ingestNoticeForFetch({
      ingestPending: true,
      mode: 'initial',
      persistedArticleCount: 0,
      fetchedArticleCount: 5,
    }),
    null,
  );

  assert.equal(
    ingestNoticeForFetch({
      ingestPending: true,
      mode: 'silent',
      persistedArticleCount: 12,
      fetchedArticleCount: 0,
    }),
    null,
  );

  assert.equal(
    ingestNoticeForFetch({
      ingestPending: true,
      mode: 'silent',
      persistedArticleCount: 0,
      fetchedArticleCount: 0,
    }),
    PENDING_INGEST_NOTICE,
  );

  assert.equal(
    ingestNoticeForFetch({
      ingestPending: false,
      mode: 'initial',
      persistedArticleCount: 0,
      fetchedArticleCount: 0,
    }),
    null,
  );
});
