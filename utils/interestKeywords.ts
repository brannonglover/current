const STOP_WORDS = new Set([
  'about',
  'after',
  'also',
  'and',
  'are',
  'been',
  'being',
  'but',
  'can',
  'could',
  'did',
  'does',
  'for',
  'from',
  'had',
  'has',
  'have',
  'her',
  'here',
  'him',
  'his',
  'how',
  'into',
  'its',
  'just',
  'may',
  'more',
  'most',
  'not',
  'now',
  'off',
  'one',
  'our',
  'out',
  'over',
  'said',
  'she',
  'some',
  'than',
  'that',
  'the',
  'their',
  'them',
  'then',
  'there',
  'these',
  'they',
  'this',
  'through',
  'too',
  'two',
  'was',
  'were',
  'what',
  'when',
  'where',
  'which',
  'while',
  'who',
  'why',
  'will',
  'with',
  'you',
  'your',
]);

const MAX_KEYWORDS = 8;

/** Lightweight title keywords — no ML, tuned for headline vocabulary. */
export function extractInterestKeywords(text: string): string[] {
  const seen = new Set<string>();
  const keywords: string[] = [];

  for (const raw of text.toLowerCase().split(/\s+/)) {
    const word = raw.replace(/[^a-z0-9-]/g, '');
    if (word.length < 3 || STOP_WORDS.has(word) || seen.has(word)) continue;
    seen.add(word);
    keywords.push(word);
    if (keywords.length >= MAX_KEYWORDS) break;
  }

  return keywords;
}

export function formatInterestLabel(value: string): string {
  if (value.includes(' ')) return value;
  return value.charAt(0).toUpperCase() + value.slice(1);
}
