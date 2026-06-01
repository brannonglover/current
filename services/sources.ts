import { API_URL } from '@/constants/api';
import { FALLBACK_SOURCES } from '@/data/sources';
import { FeedSource } from '@/types';

interface SourcesResponse {
  sources: FeedSource[];
}

export async function fetchSources(): Promise<FeedSource[]> {
  try {
    const response = await fetch(`${API_URL}/api/sources`, {
      headers: { Accept: 'application/json' },
    });
    if (!response.ok) throw new Error(`API error: ${response.status}`);
    const data = (await response.json()) as SourcesResponse;
    return data.sources.length > 0 ? data.sources : FALLBACK_SOURCES;
  } catch {
    return FALLBACK_SOURCES;
  }
}
