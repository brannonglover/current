import assert from 'node:assert/strict';

import {
  buildVimeoEmbedSource,
  buildYouTubeEmbedHtml,
  buildYouTubeEmbedSource,
  buildYouTubeEmbedSrc,
  extractYouTubeVideoId,
  isYouTubePlaybackUrl,
  YOUTUBE_EMBED_ORIGIN,
} from './youtubeEmbed';

function run(label: string, fn: () => void) {
  try {
    fn();
    console.log(`ok ${label}`);
  } catch (error) {
    console.error(`fail ${label}`);
    throw error;
  }
}

const ORIGIN = YOUTUBE_EMBED_ORIGIN;

run('extractYouTubeVideoId reads watch, embed, and short URLs', () => {
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/watch?v=dQw4w9WgXcQ'),
    'dQw4w9WgXcQ',
  );
  assert.equal(
    extractYouTubeVideoId('https://www.youtube.com/embed/dQw4w9WgXcQ'),
    'dQw4w9WgXcQ',
  );
  assert.equal(extractYouTubeVideoId('https://youtu.be/dQw4w9WgXcQ'), 'dQw4w9WgXcQ');
});

run('isYouTubePlaybackUrl detects provider or URL', () => {
  assert.equal(isYouTubePlaybackUrl('https://example.com/clip.mp4'), false);
  assert.equal(isYouTubePlaybackUrl('https://www.youtube.com/embed/abc', 'youtube'), true);
  assert.equal(isYouTubePlaybackUrl('https://www.youtube.com/embed/abc'), true);
});

run('buildYouTubeEmbedSrc includes origin and standard YouTube host', () => {
  const src = buildYouTubeEmbedSrc('dQw4w9WgXcQ', ORIGIN);
  assert.match(src, /^https:\/\/www\.youtube\.com\/embed\/dQw4w9WgXcQ\?/);
  assert.match(src, /origin=https%3A%2F%2Fcom\.brannonglover\.dailyfold/);
  assert.match(src, /playsinline=1/);
});

run('buildYouTubeEmbedHtml loads iframe API with referrer policy', () => {
  const html = buildYouTubeEmbedHtml('dQw4w9WgXcQ', ORIGIN, { notifyOnPlay: true });
  assert.match(html, /<meta name="referrer" content="strict-origin-when-cross-origin"/);
  assert.match(html, /youtube\.com\/iframe_api/);
  assert.match(html, /videoId: 'dQw4w9WgXcQ'/);
  assert.match(html, /YT\.PlayerState\.PLAYING/);
});

run('buildYouTubeEmbedSource returns html and baseUrl', () => {
  const source = buildYouTubeEmbedSource('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
  assert.ok(source);
  assert.equal(source?.baseUrl, ORIGIN);
  assert.match(source?.html ?? '', /videoId: 'dQw4w9WgXcQ'/);
});

run('buildVimeoEmbedSource wraps player URL in iframe HTML', () => {
  const source = buildVimeoEmbedSource('https://player.vimeo.com/video/123456789', {
    notifyOnPlay: true,
  });
  assert.equal(source.baseUrl, 'https://player.vimeo.com');
  assert.match(source.html, /player\.vimeo\.com\/video\/123456789/);
  assert.match(source.html, /playsinline=1/);
  assert.match(source.html, /player\.vimeo\.com\/api\/player\.js/);
});
