export interface FeedXmlMediaRef {
  url: string;
  width: number;
}

function decodeXmlEntities(value: string): string {
  return value
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>');
}

function parseMediaContentTag(attrs: string): FeedXmlMediaRef | null {
  const url = attrs.match(/\burl=["']([^"']+)["']/i)?.[1];
  if (!url) return null;

  const width = Number(attrs.match(/\bwidth=["'](\d+)["']/i)?.[1] || 0);
  return { url: decodeXmlEntities(url), width };
}

function itemLookupKeys(block: string): string[] {
  const keys: string[] = [];
  const link = block.match(/<link>([^<]+)<\/link>/i)?.[1]?.trim();
  const guid = block.match(/<guid[^>]*>([^<]+)<\/guid>/i)?.[1]?.trim();
  if (link) keys.push(link);
  if (guid && guid !== link) keys.push(guid);
  return keys;
}

/** Extract per-item media:content URLs from raw RSS/Atom XML (Guardian MRSS). */
export function extractItemMediaFromFeedXml(feedXml: string): Map<string, FeedXmlMediaRef[]> {
  const map = new Map<string, FeedXmlMediaRef[]>();
  const itemPattern = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;

  for (const match of feedXml.matchAll(itemPattern)) {
    const block = match[1] ?? '';
    const keys = itemLookupKeys(block);
    if (keys.length === 0) continue;

    const refs: FeedXmlMediaRef[] = [];
    const mediaPattern = /<media:content\b([^>]*)\/?>/gi;
    for (const mediaMatch of block.matchAll(mediaPattern)) {
      const ref = parseMediaContentTag(mediaMatch[1] ?? '');
      if (ref) refs.push(ref);
    }

    if (refs.length === 0) continue;

    for (const key of keys) {
      map.set(key, refs);
    }
  }

  return map;
}

function mediaContentCount(mediaContent: unknown): number {
  if (!mediaContent) return 0;
  if (Array.isArray(mediaContent)) return mediaContent.length;
  return 1;
}

/**
 * Backfill rss-parser media:content when MRSS tags were dropped or collapsed to one width.
 * Guardian ships multiple signed widths; keepArray is ideal, but XML is the source of truth.
 */
export function augmentFeedItemMediaFromXml(
  item: {
    link?: string;
    guid?: string;
    mediaContent?: unknown;
    'media:content'?: unknown;
  },
  mediaByKey: Map<string, FeedXmlMediaRef[]>,
): void {
  const key = item.link?.trim() || item.guid?.trim();
  if (!key) return;

  const refs = mediaByKey.get(key);
  if (!refs?.length) return;

  const existingCount = Math.max(
    mediaContentCount(item.mediaContent),
    mediaContentCount(item['media:content']),
  );
  if (existingCount > 1) return;

  const mediaContent = refs.map((ref) => ({
    $: {
      url: ref.url,
      width: String(ref.width || 0),
    },
  }));

  item.mediaContent = mediaContent;
  item['media:content'] = mediaContent;
}
