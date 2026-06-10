import { API_URL } from '@/constants/api';
import { ArticleReaderBlock, ArticleReaderContent } from '@/types/articleContent';

interface ContentResponse {
  content: ArticleReaderContent & { paragraphs?: string[] };
}

function normalizeReaderContent(
  content: ContentResponse['content'],
): ArticleReaderContent {
  if (content.blocks?.length) {
    return {
      title: content.title,
      blocks: content.blocks,
      readTimeMinutes: content.readTimeMinutes,
      source: content.source,
    };
  }

  const legacyParagraphs = content.paragraphs ?? [];
  const blocks: ArticleReaderBlock[] = legacyParagraphs.map((text) => ({
    type: 'paragraph',
    text,
  }));

  return {
    title: content.title,
    blocks,
    readTimeMinutes: content.readTimeMinutes,
    source: content.source,
  };
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

const readerContentCache = new Map<string, ArticleReaderContent>();
const inFlightFetches = new Map<string, Promise<ArticleReaderContent>>();

export function getCachedReaderContent(articleId: string): ArticleReaderContent | undefined {
  return readerContentCache.get(articleId);
}

/** Start loading reader content before navigation so the article screen can render immediately. */
export function prefetchArticleReaderContent(articleId: string): void {
  if (readerContentCache.has(articleId) || inFlightFetches.has(articleId)) return;
  void loadArticleReaderContent(articleId).catch(() => undefined);
}

async function loadArticleReaderContent(articleId: string): Promise<ArticleReaderContent> {
  const cached = readerContentCache.get(articleId);
  if (cached) return cached;

  const inFlight = inFlightFetches.get(articleId);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const response = await fetch(`${API_URL}/api/articles/${articleId}/content`, {
      headers: { Accept: 'application/json' },
    });
    const data = await parseJson<ContentResponse>(response);
    const content = normalizeReaderContent(data.content);
    readerContentCache.set(articleId, content);
    return content;
  })();

  inFlightFetches.set(articleId, promise);

  try {
    return await promise;
  } finally {
    if (inFlightFetches.get(articleId) === promise) {
      inFlightFetches.delete(articleId);
    }
  }
}

export async function fetchArticleReaderContent(
  articleId: string,
): Promise<ArticleReaderContent> {
  return loadArticleReaderContent(articleId);
}
