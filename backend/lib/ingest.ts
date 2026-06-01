import Parser from 'rss-parser';

import {
  getLastIngestAt,
  pruneOldArticles,
  setLastIngestAt,
  upsertArticle,
} from './db';
import { FEEDS } from './feeds';
import { normalizeFeedItem } from './normalize';

const parser = new Parser({
  timeout: 15000,
  headers: {
    'User-Agent': 'CurrentReader/1.0 (+https://github.com/current-app)',
  },
  customFields: {
    item: [
      ['media:content', 'mediaContent'],
      ['media:thumbnail', 'mediaThumbnail'],
      ['media:group', 'mediaGroup'],
      ['media:restriction', 'mediaRestriction'],
      ['dc:accessRights', 'accessRights'],
    ],
  },
});

const ITEMS_PER_FEED = Number(process.env.ITEMS_PER_FEED ?? 50);
const MAX_ARTICLE_AGE_DAYS = Number(process.env.MAX_ARTICLE_AGE_DAYS ?? 30);

export interface IngestResult {
  feedsProcessed: number;
  itemsSeen: number;
  itemsInserted: number;
  itemsUpdated: number;
  itemsPruned: number;
  errors: string[];
  completedAt: string;
}

export async function ingestFeeds(): Promise<IngestResult> {
  const result: IngestResult = {
    feedsProcessed: 0,
    itemsSeen: 0,
    itemsInserted: 0,
    itemsUpdated: 0,
    itemsPruned: 0,
    errors: [],
    completedAt: new Date().toISOString(),
  };

  const feedResults = await Promise.allSettled(
    FEEDS.map(async (feed) => {
      const parsed = await parser.parseURL(feed.url);
      return { feed, parsed };
    }),
  );

  for (let i = 0; i < feedResults.length; i += 1) {
    const feedResult = feedResults[i];
    const feed = FEEDS[i];

    if (feedResult.status === 'rejected') {
      const message =
        feedResult.reason instanceof Error ? feedResult.reason.message : 'Unknown feed error';
      result.errors.push(`${feed.source}: ${message}`);
      continue;
    }

    const { parsed } = feedResult.value;
    result.feedsProcessed += 1;

    for (const item of parsed.items.slice(0, ITEMS_PER_FEED)) {
      result.itemsSeen += 1;
      const article = normalizeFeedItem(item, feed);
      if (!article) continue;

      const action = upsertArticle(article);
      if (action === 'inserted') result.itemsInserted += 1;
      else result.itemsUpdated += 1;
    }
  }

  result.itemsPruned = pruneOldArticles(MAX_ARTICLE_AGE_DAYS);
  setLastIngestAt(result.completedAt);

  return result;
}

export function isIngestStale(intervalMs: number): boolean {
  const last = getLastIngestAt();
  if (!last) return true;
  return Date.now() - last.getTime() > intervalMs;
}
