export interface ArticleReaderContent {
  title: string;
  paragraphs: string[];
  readTimeMinutes: number;
  source: 'extracted' | 'feed';
}
