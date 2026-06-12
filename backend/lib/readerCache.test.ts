import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isUsableExtractedReaderCache,
  readerContentNoBetterThanFeed,
  type ReaderContent,
} from './extract';
import type { Article } from './types';

const gattoArticle: Article = {
  id: '6c3c8a6874bc688e',
  title: "Pixar's Kitty Adventure 'Gatto' Looks Purrfectly Delightful",
  excerpt:
    "'Luca' director Enrico Casarosa returns with another Italy-set tale, hitting theaters March 5, 2027.",
  body: '',
  source: 'Gizmodo',
  imageUrl: 'https://gizmodo.com/app/uploads/2026/06/Gatto_Pixar_teaser-1200x675.jpg',
  topics: ['movies'],
  readTimeMinutes: 3,
  publishedAt: '2026-06-11T19:00:30.000Z',
  url: 'https://gizmodo.com/gatto-trailer-pixar-movie-film-animated-2000770681',
};

test('readerContentNoBetterThanFeed detects excerpt-only cache', () => {
  const blocks = [{ type: 'paragraph' as const, text: gattoArticle.excerpt }];
  assert.equal(readerContentNoBetterThanFeed(blocks, gattoArticle), true);
});

test('readerContentNoBetterThanFeed accepts full extracted article with video', () => {
  const blocks = [
    {
      type: 'paragraph' as const,
      text: 'Pixar’s biggest hits tend to be its sequels, but it’s still in the business of telling incredible original stories too.',
    },
    { type: 'video' as const, url: 'https://www.youtube.com/embed/NIKfR_uF_d0', provider: 'youtube' },
    { type: 'paragraph' as const, text: 'Directed by Enrico Casarosa, Gatto hits theaters March 5, 2027.' },
  ];
  assert.equal(readerContentNoBetterThanFeed(blocks, gattoArticle), false);
});

test('isUsableExtractedReaderCache rejects thin extracted cache', () => {
  const cached: ReaderContent = {
    title: gattoArticle.title,
    blocks: [{ type: 'paragraph', text: gattoArticle.excerpt }],
    readTimeMinutes: 1,
    source: 'extracted',
  };
  assert.equal(isUsableExtractedReaderCache(cached, gattoArticle), false);
});

test('isUsableExtractedReaderCache accepts real extracted cache', () => {
  const cached: ReaderContent = {
    title: gattoArticle.title,
    blocks: [
      {
        type: 'paragraph',
        text: 'Pixar’s biggest hits tend to be its sequels, but it’s still in the business of telling incredible original stories too.',
      },
      { type: 'video', url: 'https://www.youtube.com/embed/NIKfR_uF_d0', provider: 'youtube' },
    ],
    readTimeMinutes: 2,
    source: 'extracted',
  };
  assert.equal(isUsableExtractedReaderCache(cached, gattoArticle), true);
});
