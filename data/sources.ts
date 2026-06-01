import { resolveSourceLogoUrl } from '../catalog/logoUrl';
import { SOURCE_CATALOG } from '../catalog/sources';
import { FeedSource } from '@/types';

/** Offline fallback when /api/sources is unavailable — derived from catalog/sources.ts */
export const FALLBACK_SOURCES: FeedSource[] = SOURCE_CATALOG.map((entry) => ({
  id: entry.id,
  name: entry.name,
  description: entry.description,
  primaryTopic: entry.primaryTopic,
  topics: entry.topics,
  logoUrl: resolveSourceLogoUrl(entry),
}));
