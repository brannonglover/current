import { API_URL } from '@/constants/api';
import { ArticleReaderContent } from '@/types/articleContent';

interface ContentResponse {
  content: ArticleReaderContent;
}

async function parseJson<T>(response: Response): Promise<T> {
  if (!response.ok) {
    throw new Error(`API error: ${response.status}`);
  }
  return response.json() as Promise<T>;
}

export async function fetchArticleReaderContent(
  articleId: string,
): Promise<ArticleReaderContent> {
  const response = await fetch(`${API_URL}/api/articles/${articleId}/content`, {
    headers: { Accept: 'application/json' },
  });
  const data = await parseJson<ContentResponse>(response);
  return data.content;
}
