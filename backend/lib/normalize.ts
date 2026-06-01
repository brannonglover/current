import { createHash } from 'crypto';

import { inferSportTags } from '../../catalog/sports';

import { detectRequiresSubscription } from './subscription';
import { Article, FeedConfig, Topic } from './types';

const TOPICS: Topic[] = [
  'technology',
  'culture',
  'science',
  'business',
  'politics',
  'health',
  'design',
  'world',
  'sports',
  'art',
  'gardening',
];

const PLACEHOLDER_IMAGE =
  'https://images.unsplash.com/photo-1504711434966-e33886168f5c?w=800&q=80';

function stripHtml(html: string): string {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, '')
    .replace(/<style[\s\S]*?<\/style>/gi, '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
}

function hashId(input: string): string {
  return createHash('sha256').update(input).digest('hex').slice(0, 16);
}

function normalizeImageUrl(url: string | null | undefined, pageUrl?: string): string | null {
  if (!url?.trim()) return null;

  let normalized = url
    .trim()
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

  if (normalized.startsWith('//')) {
    normalized = `https:${normalized}`;
  } else if (normalized.startsWith('/')) {
    if (!pageUrl) return null;
    try {
      normalized = new URL(normalized, pageUrl).href;
    } catch {
      return null;
    }
  } else if (normalized.startsWith('http://')) {
    normalized = `https://${normalized.slice('http://'.length)}`;
  }

  try {
    return new URL(normalized).href;
  } catch {
    return null;
  }
}

function isImageMedia(attrs: { medium?: string; type?: string; url?: string }): boolean {
  if (attrs.medium === 'image') return true;
  if (attrs.type?.startsWith('image')) return true;
  if (attrs.url && /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(attrs.url)) return true;
  return false;
}

function readMediaUrl(field: unknown): string | null {
  if (!field) return null;

  if (Array.isArray(field)) {
    let fallback: string | null = null;
    for (const entry of field) {
      if (typeof entry === 'object' && entry) {
        const attrs = (entry as Record<string, unknown>).$ as
          | { medium?: string; type?: string; url?: string }
          | undefined;
        if (attrs?.url && isImageMedia(attrs)) return attrs.url;
      }
      const url = readMediaUrl(entry);
      if (url && !fallback) fallback = url;
    }
    return fallback;
  }

  if (typeof field === 'string') return field;

  if (typeof field === 'object') {
    const record = field as Record<string, unknown>;
    const nested = record['media:content'] ?? record.mediaContent;
    if (nested) {
      const nestedUrl = readMediaUrl(nested);
      if (nestedUrl) return nestedUrl;
    }

    const attrs = record.$ as { url?: string } | undefined;
    if (attrs?.url) return attrs.url;
    if (typeof record.url === 'string') return record.url;
  }

  return null;
}

function extractImageFromHtml(html: string): string | null {
  const match = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return match?.[1] ?? null;
}

function extractImage(
  item: {
    link?: string;
    content?: string;
    summary?: string;
    enclosure?: { url?: string; type?: string };
    mediaContent?: unknown;
    mediaThumbnail?: unknown;
    mediaGroup?: unknown;
    'media:content'?: unknown;
    'media:thumbnail'?: unknown;
    'media:group'?: unknown;
  },
  pageUrl?: string,
): string | null {
  const candidates = [
    readMediaUrl(item.mediaThumbnail),
    readMediaUrl(item['media:thumbnail']),
    readMediaUrl(item.mediaContent),
    readMediaUrl(item['media:content']),
    readMediaUrl(item.mediaGroup),
    readMediaUrl(item['media:group']),
  ];

  if (item.enclosure?.url) {
    const type = item.enclosure.type ?? '';
    const url = item.enclosure.url;
    if (type.startsWith('image') || /\.(jpe?g|png|gif|webp|avif)(\?|$)/i.test(url)) {
      candidates.unshift(url);
    }
  }

  const html = item.content ?? item.summary ?? '';
  const htmlImage = extractImageFromHtml(html);
  if (htmlImage) candidates.push(htmlImage);

  for (const candidate of candidates) {
    const normalized = normalizeImageUrl(candidate, pageUrl);
    if (normalized) return normalized;
  }

  return null;
}

function inferExtraTopics(text: string, base: Topic[], feedPrimaryTopic?: Topic): Topic[] {
  const lower = text.toLowerCase();
  const allowed = new Set<Topic>(base);
  const inferred = new Set<Topic>();

  const rules: [RegExp, Topic][] = [
    [
      /\b(sport|sports|football|basketball|baseball|hockey|soccer|tennis|golf|cricket|rugby|mma|olympic|playoff|playoffs|championship|nba|nfl|mlb|nhl|mls|fifa|uefa|premier league|champions league|la liga|bundesliga|serie a|world cup|super bowl|stanley cup|world series|formula 1|grand prix|matchday|goalkeeper|quarterback|pitcher|touchdown|home run|hat-trick)\b/,
      'sports',
    ],
    [/\b(garden|gardening|landscap|horticultur|backyard|perennial|vegetable patch)\b/, 'gardening'],
    [/\b(art|artist|gallery|museum|painting|sculpture|exhibition|curator)\b/, 'art'],
    [/\b(ai|artificial intelligence|machine learning|software|tech)\b/, 'technology'],
    [/\b(health|medical|medicine|wellness|diet)\b/, 'health'],
    [/\b(business|economy|market|startup|finance)\b/, 'business'],
    [/\b(science|research|study|physics|biology)\b/, 'science'],
    [/\b(design|architecture|interior)\b/, 'design'],
    [
      /\b(election|elections|government|policy|politic|politics|political|senate|congress|candidate|candidates|ballot|vote|voting|campaign|republican|democrat|democratic|gop|incumbent|legislat|parliament|minister|president|governor|white house|capitol)\b/,
      'politics',
    ],
    [/\b(culture|film|music|society|theater|theatre|literature|books)\b/, 'culture'],
    [/\b(world|global|international|war|climate)\b/, 'world'],
  ];

  for (const [pattern, topic] of rules) {
    if (topic === 'world' && feedPrimaryTopic === 'sports') continue;
    if (!allowed.has(topic)) continue;
    if (pattern.test(lower)) inferred.add(topic);
  }

  if (inferred.size === 0 && feedPrimaryTopic && allowed.has(feedPrimaryTopic)) {
    inferred.add(feedPrimaryTopic);
  }

  if (inferred.has('sports') && inferred.has('world')) {
    inferred.delete('world');
  }

  return TOPICS.filter((t) => inferred.has(t)).slice(0, 4);
}

function readTimeMinutes(text: string): number {
  const words = text.split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 200));
}

function safeIsoDate(value: string | undefined): string {
  if (!value) return new Date().toISOString();
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? new Date().toISOString() : parsed.toISOString();
}

export function normalizeFeedItem(
  item: {
    title?: string;
    link?: string;
    pubDate?: string;
    isoDate?: string;
    contentSnippet?: string;
    content?: string;
    summary?: string;
    categories?: unknown;
    accessRights?: unknown;
    mediaRestriction?: unknown;
    enclosure?: { url?: string; type?: string };
    mediaContent?: unknown;
    mediaThumbnail?: unknown;
    mediaGroup?: unknown;
    'media:content'?: unknown;
    'media:thumbnail'?: unknown;
    'media:group'?: unknown;
    'media:restriction'?: unknown;
  },
  feed: FeedConfig,
): Article | null {
  const url = item.link?.trim();
  const title = item.title?.trim();
  if (!url || !title) return null;

  const rawBody = item.content ?? item.summary ?? item.contentSnippet ?? '';
  const plain = stripHtml(rawBody || item.contentSnippet || '');
  const excerptSource = item.contentSnippet ?? item.summary ?? plain;
  const excerpt = stripHtml(excerptSource).slice(0, 280);
  const body = plain.slice(0, 8000) || excerpt;

  const publishedAt = safeIsoDate(item.isoDate ?? item.pubDate);
  const imageUrl = extractImage(item, url) ?? PLACEHOLDER_IMAGE;
  const text = `${title} ${excerpt}`;
  const topics = inferExtraTopics(text, feed.topics, feed.primaryTopic);
  const sportTags = inferSportTags(text, feed.sportTags ?? []);
  const requiresSubscription = detectRequiresSubscription({
    title,
    excerpt: excerpt || title,
    body,
    categories: item.categories,
    accessRights: item.accessRights,
    mediaRestriction: item.mediaRestriction ?? item['media:restriction'],
    feed,
  });

  return {
    id: hashId(url),
    title,
    excerpt: excerpt || title,
    body,
    source: feed.source,
    imageUrl,
    topics,
    sportTags: sportTags.length > 0 ? sportTags : undefined,
    readTimeMinutes: readTimeMinutes(body),
    publishedAt,
    url,
    requiresSubscription: requiresSubscription || undefined,
  };
}
