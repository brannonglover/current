import { Article } from '@/types';

/** Paragraphs from feed body/excerpt when extracted reader content is missing or empty. */
export function feedParagraphsFromArticle(article: Article): string[] {
  const fromBody = article.body
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  if (fromBody.length > 0) return fromBody;
  const excerpt = article.excerpt.trim();
  if (excerpt) return [excerpt];
  return [];
}

function normalizeParagraphText(text: string): string {
  return text
    .toLowerCase()
    .replace(/[''`]/g, "'")
    .replace(/[""]/g, '"')
    .replace(/\s+/g, ' ')
    .replace(/[^\p{L}\p{N}\s'"]/gu, '')
    .trim();
}

/** True when two paragraphs are the same standfirst/lede (handles truncated feed excerpts). */
export function paragraphsSubstantiallyMatch(a: string, b: string): boolean {
  const left = normalizeParagraphText(a);
  const right = normalizeParagraphText(b);
  if (!left || !right) return false;
  if (left === right) return true;
  if (left.includes(right) || right.includes(left)) return true;

  const wordsLeft = left.split(' ').filter((word) => word.length > 2);
  const wordsRight = new Set(right.split(' ').filter((word) => word.length > 2));
  if (wordsLeft.length === 0 || wordsRight.size === 0) return false;

  let overlap = 0;
  for (const word of wordsLeft) {
    if (wordsRight.has(word)) overlap += 1;
  }

  const minSize = Math.min(wordsLeft.length, wordsRight.size);
  return overlap / minSize >= 0.85;
}

function dedupeLeadingParagraph(paragraphs: string[], lede: string): string[] {
  if (paragraphs.length === 0) return paragraphs;
  return paragraphsSubstantiallyMatch(paragraphs[0], lede) ? paragraphs.slice(1) : paragraphs;
}

export interface ReaderParagraphLayout {
  /** Text for the feed preview callout; null when body should stand alone. */
  feedLede: string | null;
  bodyParagraphs: string[];
}

/** Splits feed lede vs article body and dedupes standfirst/excerpt overlap after extraction. */
export function resolveReaderParagraphLayout(params: {
  article: Article;
  extractedParagraphs: string[] | null;
}): ReaderParagraphLayout {
  const { article, extractedParagraphs } = params;
  const excerpt = article.excerpt.trim();
  const feedParagraphs = feedParagraphsFromArticle(article);

  const paragraphs = extractedParagraphs ?? feedParagraphs;

  if (!extractedParagraphs) {
    const feedLede = excerpt || null;
    return {
      feedLede,
      bodyParagraphs: feedLede ? dedupeLeadingParagraph(paragraphs, feedLede) : paragraphs,
    };
  }

  if (excerpt && paragraphs.length > 0 && paragraphsSubstantiallyMatch(paragraphs[0], excerpt)) {
    return {
      feedLede: excerpt,
      bodyParagraphs: paragraphs.slice(1),
    };
  }

  return { feedLede: null, bodyParagraphs: paragraphs };
}
