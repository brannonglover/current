/** Derive a publisher favicon URL from a feed URL when catalog has no explicit logoUrl. */
export function resolveSourceLogoUrl(entry: {
  url: string;
  logoUrl?: string;
  /** Use when the feed hostname is not the brand domain (e.g. feeds.bbci.co.uk → bbc.co.uk). */
  logoDomain?: string;
}): string {
  if (entry.logoUrl) return entry.logoUrl;

  const domain = entry.logoDomain ?? brandDomainFromFeedUrl(entry.url);
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

function brandDomainFromFeedUrl(feedUrl: string): string {
  const host = new URL(feedUrl).hostname;
  return host.replace(/^(feeds|rss|moxie)\./, '').replace(/^www\./, '');
}
