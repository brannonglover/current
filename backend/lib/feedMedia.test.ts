import assert from 'node:assert/strict';
import test from 'node:test';

import {
  augmentFeedItemMediaFromXml,
  extractItemMediaFromFeedXml,
} from './feedMedia';
import { normalizeFeedItem } from './normalize';
import type { FeedConfig } from './types';

const GUARDIAN_XML_SNIPPET = `
<item>
  <title>Test story</title>
  <link>https://www.theguardian.com/world/2026/jun/09/test-story</link>
  <guid>https://www.theguardian.com/world/2026/jun/09/test-story</guid>
  <media:content width="140" url="https://i.guim.co.uk/img/media/abc/0_0_1200_800/master/1200.jpg?width=140&amp;quality=85&amp;auto=format&amp;fit=max&amp;s=small"/>
  <media:content width="700" url="https://i.guim.co.uk/img/media/abc/0_0_1200_800/master/1200.jpg?width=700&amp;quality=85&amp;auto=format&amp;fit=max&amp;s=large"/>
</item>`;

const guardianFeed: FeedConfig = {
  id: 'guardian',
  url: 'https://www.theguardian.com/world/rss',
  source: 'The Guardian',
  topics: ['world'],
  primaryTopic: 'world',
};

test('extractItemMediaFromFeedXml reads Guardian media:content widths', () => {
  const map = extractItemMediaFromFeedXml(GUARDIAN_XML_SNIPPET);
  const refs = map.get('https://www.theguardian.com/world/2026/jun/09/test-story');

  assert.equal(refs?.length, 2);
  assert.equal(refs?.[0]?.width, 140);
  assert.match(refs?.[0]?.url ?? '', /width=140/);
  assert.equal(refs?.[1]?.width, 700);
  assert.match(refs?.[1]?.url ?? '', /width=700/);
});

test('augmentFeedItemMediaFromXml backfills default rss-parser items', () => {
  const item = {
    title: 'Test story',
    link: 'https://www.theguardian.com/world/2026/jun/09/test-story',
    guid: 'https://www.theguardian.com/world/2026/jun/09/test-story',
  };
  const mediaByKey = extractItemMediaFromFeedXml(GUARDIAN_XML_SNIPPET);

  augmentFeedItemMediaFromXml(item, mediaByKey);

  const normalized = normalizeFeedItem(item, guardianFeed);
  assert.match(normalized?.article.imageUrl ?? '', /width=700/);
  assert.match(normalized?.article.imageUrl ?? '', /s=large/);
});

test('augmentFeedItemMediaFromXml does not override multiple parser widths', () => {
  const item = {
    link: 'https://www.theguardian.com/world/2026/jun/09/test-story',
    mediaContent: [
      { $: { width: '140', url: 'https://example.com/a.jpg' } },
      { $: { width: '700', url: 'https://example.com/b.jpg' } },
    ],
  };
  const mediaByKey = extractItemMediaFromFeedXml(GUARDIAN_XML_SNIPPET);

  augmentFeedItemMediaFromXml(item, mediaByKey);

  assert.equal(item.mediaContent[1]?.$.url, 'https://example.com/b.jpg');
});
