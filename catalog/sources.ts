import type { SportTag } from './sports';

/**
 * Curated publisher catalog — single place to add or edit outlets.
 * Used by the API (RSS ingest) and the app (Sources screen + offline fallback).
 *
 * primaryTopic: main "curiosity" for grouping in Profile → Sources (more UX coming).
 * topics: candidate article tags for keyword inference in normalize (primaryTopic is fallback).
 * sportTags: default sport/league facets for articles from this feed.
 */
export type Topic =
  | 'technology'
  | 'culture'
  | 'science'
  | 'business'
  | 'politics'
  | 'health'
  | 'design'
  | 'world'
  | 'sports'
  | 'art'
  | 'gardening';

export interface SourceCatalogEntry {
  id: string;
  url: string;
  name: string;
  description: string;
  primaryTopic: Topic;
  topics: Topic[];
  /** Default sport/league tags applied at ingest for sports feeds. */
  sportTags?: SportTag[];
  /** Explicit logo URL; omit to auto-derive from feed URL via favicon CDN. */
  logoUrl?: string;
  /** Brand domain when feed hostname differs (e.g. feeds.bbci.co.uk → bbc.co.uk). */
  logoDomain?: string;
  /**
   * Publisher often uses per-article paywalls. Never marks every article alone;
   * combined with RSS signals and short/teaser body heuristics at ingest.
   */
  subscriptionPublisher?: boolean;
}

export const SOURCE_CATALOG: SourceCatalogEntry[] = [
  // —— World & breaking news ——
  {
    id: 'bbc-news',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    name: 'BBC News',
    description: 'Global news and current events',
    primaryTopic: 'world',
    topics: ['world', 'politics'],
    logoDomain: 'bbc.co.uk',
  },
  {
    id: 'cnn',
    url: 'http://rss.cnn.com/rss/cnn_topstories.rss',
    name: 'CNN',
    description: 'Breaking news and top stories',
    primaryTopic: 'world',
    topics: ['world', 'politics'],
  },
  {
    id: 'fox-news',
    url: 'https://moxie.foxnews.com/google-publisher/latest.xml',
    name: 'Fox News',
    description: 'U.S. and world headlines',
    primaryTopic: 'world',
    topics: ['world', 'politics'],
  },
  {
    id: 'npr',
    url: 'https://feeds.npr.org/1001/rss.xml',
    name: 'NPR',
    description: 'National and international news',
    primaryTopic: 'world',
    topics: ['world', 'culture', 'politics'],
  },
  {
    id: 'guardian',
    url: 'https://www.theguardian.com/world/rss',
    name: 'The Guardian',
    description: 'World news and analysis',
    primaryTopic: 'world',
    topics: ['world', 'politics'],
  },
  {
    id: 'al-jazeera',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    name: 'Al Jazeera',
    description: 'International news and perspectives',
    primaryTopic: 'world',
    topics: ['world', 'politics'],
  },
  {
    id: 'rest-of-world',
    url: 'https://restofworld.org/feed/latest',
    name: 'Rest of World',
    description: 'Technology and society outside the West',
    primaryTopic: 'world',
    topics: ['world', 'technology', 'culture'],
  },
  {
    id: 'pbs-newshour',
    url: 'https://www.pbs.org/newshour/feeds/rss/headlines',
    name: 'PBS NewsHour',
    description: 'In-depth U.S. and global reporting',
    primaryTopic: 'world',
    topics: ['world', 'politics'],
  },

  // —— Politics & policy ——
  {
    id: 'nyt',
    url: 'https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml',
    name: 'The New York Times',
    description: 'National and international coverage',
    primaryTopic: 'politics',
    topics: ['politics', 'world', 'culture'],
    subscriptionPublisher: true,
  },
  {
    id: 'washington-post',
    url: 'https://feeds.washingtonpost.com/rss/world',
    name: 'The Washington Post',
    description: 'Politics and world affairs',
    primaryTopic: 'politics',
    topics: ['politics', 'world'],
    subscriptionPublisher: true,
  },
  {
    id: 'msnbc',
    url: 'https://www.ms.now/rss',
    name: 'MSNBC',
    description: 'U.S. politics and news',
    primaryTopic: 'politics',
    topics: ['politics', 'world'],
    logoDomain: 'msnbc.com',
  },
  {
    id: 'vox',
    url: 'https://www.vox.com/rss/index.xml',
    name: 'Vox',
    description: 'Policy, politics, and explainers',
    primaryTopic: 'politics',
    topics: ['politics', 'culture'],
  },
  {
    id: 'axios',
    url: 'https://www.axios.com/feeds/feed.rss',
    name: 'Axios',
    description: 'Politics, business, and tech briefs',
    primaryTopic: 'politics',
    topics: ['politics', 'business', 'technology'],
  },
  {
    id: 'huffpost',
    url: 'https://www.huffpost.com/section/front-page/feed',
    name: 'HuffPost',
    description: 'News and opinion',
    primaryTopic: 'politics',
    topics: ['politics', 'culture'],
  },
  {
    id: 'propublica',
    url: 'https://www.propublica.org/feeds/propublica/main',
    name: 'ProPublica',
    description: 'Investigative journalism',
    primaryTopic: 'politics',
    topics: ['politics', 'world'],
  },
  {
    id: 'the-atlantic',
    url: 'https://feeds.feedburner.com/TheAtlantic',
    name: 'The Atlantic',
    description: 'Culture, politics, and long-form journalism',
    primaryTopic: 'politics',
    topics: ['culture', 'politics', 'world'],
    logoDomain: 'theatlantic.com',
    subscriptionPublisher: true,
  },

  // —— Technology ——
  {
    id: 'techcrunch',
    url: 'https://techcrunch.com/feed/',
    name: 'TechCrunch',
    description: 'Startups, venture, and tech industry',
    primaryTopic: 'technology',
    topics: ['technology', 'business'],
  },
  {
    id: 'ars-technica',
    url: 'https://feeds.arstechnica.com/arstechnica/index',
    name: 'Ars Technica',
    description: 'Technology, science, and policy',
    primaryTopic: 'technology',
    topics: ['technology', 'science'],
  },
  {
    id: 'mit-tech-review',
    url: 'https://www.technologyreview.com/feed/',
    name: 'MIT Technology Review',
    description: 'Emerging technology and research',
    primaryTopic: 'technology',
    topics: ['technology', 'science'],
  },
  {
    id: 'wired',
    url: 'https://www.wired.com/feed/rss',
    name: 'Wired',
    description: 'Tech, science, and digital culture',
    primaryTopic: 'technology',
    topics: ['technology', 'culture'],
  },
  {
    id: 'the-verge',
    url: 'https://www.theverge.com/rss/index.xml',
    name: 'The Verge',
    description: 'Consumer tech and gadgets',
    primaryTopic: 'technology',
    topics: ['technology', 'culture'],
  },
  {
    id: 'engadget',
    url: 'https://www.engadget.com/rss.xml',
    name: 'Engadget',
    description: 'Gadgets and consumer electronics',
    primaryTopic: 'technology',
    topics: ['technology'],
  },
  {
    id: 'cnet',
    url: 'https://www.cnet.com/rss/news/',
    name: 'CNET',
    description: 'Tech news, reviews, and how-tos',
    primaryTopic: 'technology',
    topics: ['technology'],
  },
  {
    id: 'gizmodo',
    url: 'https://gizmodo.com/rss',
    name: 'Gizmodo',
    description: 'Tech, science, and internet culture',
    primaryTopic: 'technology',
    topics: ['technology', 'science', 'culture'],
  },
  {
    id: 'mashable',
    url: 'https://mashable.com/feeds/rss/all',
    name: 'Mashable',
    description: 'Digital culture and entertainment tech',
    primaryTopic: 'technology',
    topics: ['technology', 'culture'],
  },

  // —— Business & markets ——
  {
    id: 'bloomberg',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    name: 'Bloomberg',
    description: 'Markets, business, and finance',
    primaryTopic: 'business',
    topics: ['business', 'world'],
    subscriptionPublisher: true,
  },
  {
    id: 'economist',
    url: 'https://www.economist.com/the-world-this-week/rss.xml',
    name: 'The Economist',
    description: 'Global business and affairs',
    primaryTopic: 'business',
    topics: ['business', 'world', 'politics'],
    subscriptionPublisher: true,
  },
  {
    id: 'forbes',
    url: 'https://www.forbes.com/innovation/feed2/',
    name: 'Forbes',
    description: 'Business, innovation, and leadership',
    primaryTopic: 'business',
    topics: ['business', 'technology'],
  },

  // —— Science & health ——
  {
    id: 'scientific-american',
    url: 'https://www.scientificamerican.com/platform/syndication/rss/',
    name: 'Scientific American',
    description: 'Science news and research',
    primaryTopic: 'science',
    topics: ['science', 'health'],
  },

  // —— Culture & ideas ——
  {
    id: 'new-yorker',
    subscriptionPublisher: true,
    url: 'https://www.newyorker.com/feed/everything',
    name: 'The New Yorker',
    description: 'Reporting, fiction, and criticism',
    primaryTopic: 'culture',
    topics: ['culture', 'politics'],
    logoDomain: 'newyorker.com',
  },
  {
    id: 'slate',
    url: 'https://www.slate.com/feeds/all.rss',
    name: 'Slate',
    description: 'News, politics, and culture',
    primaryTopic: 'culture',
    topics: ['culture', 'politics'],
  },

  // —— Sports ——
  {
    id: 'espn',
    url: 'https://www.espn.com/espn/rss/news',
    name: 'ESPN',
    description: 'Sports news and scores',
    primaryTopic: 'sports',
    topics: ['sports'],
  },
  {
    id: 'espn-nfl',
    url: 'https://www.espn.com/espn/rss/nfl/news',
    name: 'ESPN NFL',
    description: 'NFL news, scores, and analysis',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['football'],
    logoDomain: 'espn.com',
  },
  {
    id: 'espn-nba',
    url: 'https://www.espn.com/espn/rss/nba/news',
    name: 'ESPN NBA',
    description: 'NBA news, scores, and analysis',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['basketball'],
    logoDomain: 'espn.com',
  },
  {
    id: 'espn-mlb',
    url: 'https://www.espn.com/espn/rss/mlb/news',
    name: 'ESPN MLB',
    description: 'MLB news, scores, and analysis',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['baseball'],
    logoDomain: 'espn.com',
  },
  {
    id: 'espn-nhl',
    url: 'https://www.espn.com/espn/rss/nhl/news',
    name: 'ESPN NHL',
    description: 'NHL news, scores, and analysis',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['hockey'],
    logoDomain: 'espn.com',
  },
  {
    id: 'espn-soccer',
    url: 'https://www.espn.com/espn/rss/soccer/news',
    name: 'ESPN Soccer',
    description: 'Soccer and international football',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer'],
    logoDomain: 'espn.com',
  },
  {
    id: 'espn-college-football',
    url: 'https://www.espn.com/espn/rss/college-football/news',
    name: 'ESPN College Football',
    description: 'NCAA football news and analysis',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['football'],
    logoDomain: 'espn.com',
  },
  {
    id: 'cbs-sports',
    url: 'https://www.cbssports.com/rss/headlines/',
    name: 'CBS Sports',
    description: 'Major league and college sports headlines',
    primaryTopic: 'sports',
    topics: ['sports'],
  },
  {
    id: 'yahoo-sports',
    url: 'https://sports.yahoo.com/rss/',
    name: 'Yahoo Sports',
    description: 'Sports news across major leagues',
    primaryTopic: 'sports',
    topics: ['sports'],
  },
  {
    id: 'mlb-com',
    url: 'https://www.mlb.com/feeds/news/rss.xml',
    name: 'MLB.com',
    description: 'Official Major League Baseball news',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['baseball'],
    logoDomain: 'mlb.com',
  },
  {
    id: 'bbc-sport',
    url: 'https://feeds.bbci.co.uk/sport/rss.xml',
    name: 'BBC Sport',
    description: 'Global sports coverage',
    primaryTopic: 'sports',
    topics: ['sports'],
    logoDomain: 'bbc.co.uk',
  },
  {
    id: 'bbc-sport-football',
    url: 'https://feeds.bbci.co.uk/sport/football/rss.xml',
    name: 'BBC Sport Football',
    description: 'Football and international soccer',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer'],
    logoDomain: 'bbc.co.uk',
  },
  {
    id: 'sky-sports-pl',
    url: 'https://www.skysports.com/rss/11661',
    name: 'Sky Sports Premier League',
    description: 'Premier League news, transfers, and analysis',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer', 'premier-league'],
    logoDomain: 'skysports.com',
  },
  {
    id: 'guardian-sport',
    url: 'https://www.theguardian.com/sport/rss',
    name: 'The Guardian Sport',
    description: 'Sports news and analysis',
    primaryTopic: 'sports',
    topics: ['sports'],
    logoDomain: 'theguardian.com',
  },
  {
    id: 'guardian-football',
    url: 'https://www.theguardian.com/football/rss',
    name: 'The Guardian Football',
    description: 'Football and international soccer',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer'],
    logoDomain: 'theguardian.com',
  },
  {
    id: 'bbc-premier-league',
    url: 'https://feeds.bbci.co.uk/sport/football/premier-league/rss.xml',
    name: 'BBC Sport Premier League',
    description: 'Premier League news and match coverage',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer', 'premier-league'],
    logoDomain: 'bbc.co.uk',
  },
  {
    id: 'guardian-premier-league',
    url: 'https://www.theguardian.com/football/premierleague/rss',
    name: 'The Guardian Premier League',
    description: 'Premier League news, analysis, and features',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer', 'premier-league'],
    logoDomain: 'theguardian.com',
  },
  {
    id: 'espn-uk-football',
    url: 'https://www.espn.co.uk/espn/rss/football/news',
    name: 'ESPN UK Football',
    description: 'UK and European football news',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer'],
    logoDomain: 'espn.co.uk',
  },
  {
    id: 'bbc-european-football',
    url: 'https://feeds.bbci.co.uk/sport/football/european/rss.xml',
    name: 'BBC Sport European Football',
    description: 'European club and international football',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer'],
    logoDomain: 'bbc.co.uk',
  },
  {
    id: 'bbc-champions-league',
    url: 'https://feeds.bbci.co.uk/sport/football/champions-league/rss.xml',
    name: 'BBC Sport Champions League',
    description: 'UEFA Champions League news and match reports',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer', 'champions-league'],
    logoDomain: 'bbc.co.uk',
  },
  {
    id: 'guardian-champions-league',
    url: 'https://www.theguardian.com/football/championsleague/rss',
    name: 'The Guardian Champions League',
    description: 'Champions League news and analysis',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer', 'champions-league'],
    logoDomain: 'theguardian.com',
  },
  {
    id: 'marca',
    url: 'https://www.marca.com/rss/futbol.xml',
    name: 'Marca',
    description: 'Spanish and La Liga football news',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer', 'la-liga'],
    logoDomain: 'marca.com',
  },
  {
    id: 'football-italia',
    url: 'https://www.football-italia.net/feed',
    name: 'Football Italia',
    description: 'Serie A and Italian football news',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer', 'serie-a'],
    logoDomain: 'football-italia.net',
  },
  {
    id: 'bundesliga',
    url: 'https://www.bundesliga.com/en/bundesliga/news/rss',
    name: 'Bundesliga',
    description: 'Official Bundesliga news and features',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer', 'bundesliga'],
    logoDomain: 'bundesliga.com',
  },
  {
    id: 'guardian-bundesliga',
    url: 'https://www.theguardian.com/football/bundesligafootball/rss',
    name: 'The Guardian Bundesliga',
    description: 'Bundesliga news and analysis',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer', 'bundesliga'],
    logoDomain: 'theguardian.com',
  },
  {
    id: 'fourfourtwo',
    url: 'https://www.fourfourtwo.com/feeds/all',
    name: 'FourFourTwo',
    description: 'European and world football news and features',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['soccer'],
    logoDomain: 'fourfourtwo.com',
  },
  {
    id: 'guardian-baseball',
    url: 'https://www.theguardian.com/sport/baseball/rss',
    name: 'The Guardian Baseball',
    description: 'Major League Baseball news and analysis',
    primaryTopic: 'sports',
    topics: ['sports'],
    sportTags: ['baseball'],
    logoDomain: 'theguardian.com',
  },

  // —— Art ——
  {
    id: 'hyperallergic',
    url: 'https://hyperallergic.com/feed/',
    name: 'Hyperallergic',
    description: 'Contemporary art news and criticism',
    primaryTopic: 'art',
    topics: ['art', 'culture'],
  },
  {
    id: 'artsy',
    url: 'https://www.artsy.net/rss/news',
    name: 'Artsy',
    description: 'Art market and exhibition news',
    primaryTopic: 'art',
    topics: ['art', 'culture'],
  },
  {
    id: 'bbc-arts',
    url: 'https://feeds.bbci.co.uk/news/entertainment_and_arts/rss.xml',
    name: 'BBC Arts',
    description: 'Entertainment and arts coverage',
    primaryTopic: 'art',
    topics: ['art', 'culture'],
    logoDomain: 'bbc.co.uk',
  },

  // —— Gardening ——
  {
    id: 'gardenista',
    url: 'https://www.gardenista.com/feed/',
    name: 'Gardenista',
    description: 'Garden design and outdoor living',
    primaryTopic: 'gardening',
    topics: ['gardening', 'design'],
  },
  {
    id: 'fine-gardening',
    url: 'https://www.finegardening.com/feed/',
    name: 'Fine Gardening',
    description: 'Plants, techniques, and garden design',
    primaryTopic: 'gardening',
    topics: ['gardening', 'design'],
  },

  // —— Design ——
  {
    id: 'dezeen',
    url: 'https://www.dezeen.com/feed/',
    name: 'Dezeen',
    description: 'Architecture, interiors, and design',
    primaryTopic: 'design',
    topics: ['design', 'culture', 'art'],
  },
];
