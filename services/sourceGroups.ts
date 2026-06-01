import { CURIOSITY_ORDER } from '@/constants/curiosities';
import { FeedSource, Topic } from '@/types';

export interface SourceCuriosityGroup {
  topic: Topic;
  sources: FeedSource[];
}

export function groupSourcesByCuriosity(sources: FeedSource[]): SourceCuriosityGroup[] {
  const buckets = new Map<Topic, FeedSource[]>();

  for (const source of sources) {
    const topic = source.primaryTopic ?? source.topics[0];
    if (!topic) continue;
    const list = buckets.get(topic) ?? [];
    list.push(source);
    buckets.set(topic, list);
  }

  return CURIOSITY_ORDER.filter((topic) => buckets.has(topic)).map((topic) => ({
    topic,
    sources: (buckets.get(topic) ?? []).sort((a, b) => a.name.localeCompare(b.name)),
  }));
}
