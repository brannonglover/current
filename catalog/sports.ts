/** Sport/league facets for articles tagged with the sports topic. */
export type SportTag =
  | 'baseball'
  | 'basketball'
  | 'football'
  | 'hockey'
  | 'soccer'
  | 'premier-league'
  | 'la-liga'
  | 'serie-a'
  | 'bundesliga'
  | 'champions-league';

export const SPORT_TAG_ORDER: SportTag[] = [
  'baseball',
  'basketball',
  'football',
  'hockey',
  'soccer',
  'premier-league',
  'la-liga',
  'serie-a',
  'bundesliga',
  'champions-league',
];

export const SPORT_TAG_LABELS: Record<SportTag, string> = {
  baseball: 'Baseball',
  basketball: 'Basketball',
  football: 'American Football',
  hockey: 'Hockey',
  soccer: 'Football',
  'premier-league': 'Premier League',
  'la-liga': 'La Liga',
  'serie-a': 'Serie A',
  bundesliga: 'Bundesliga',
  'champions-league': 'Champions League',
};

const LEAGUE_TAGS: SportTag[] = [
  'premier-league',
  'la-liga',
  'serie-a',
  'bundesliga',
  'champions-league',
];

const NFL_INFERENCE_PATTERN =
  /\b(nfl|super bowl|quarterback|touchdown|linebacker|wide receiver|american football|college football|ncaa football)\b/i;

const SPORT_INFERENCE_RULES: [SportTag, RegExp][] = [
  ['baseball', /\b(baseball|mlb|world series|home run|pitcher|slugger)\b/i],
  ['basketball', /\b(basketball|nba|ncaa basketball|dunk|three-pointer|free throw)\b/i],
  ['football', NFL_INFERENCE_PATTERN],
  ['hockey', /\b(hockey|nhl|stanley cup|puck|power play|goaltender|faceoff)\b/i],
  ['soccer', /\b(soccer|mls|fifa|world cup|goalkeeper|matchday|footballer|striker|midfielder|penalty|offside|transfer window|premier league|la liga|bundesliga|serie a|champions league|uefa)\b/i],
  [
    'premier-league',
    /\b(premier league|\bepl\b|manchester united|man united|man utd|manchester city|man city|liverpool fc|liverpool\b|arsenal fc|\barsenal\b|chelsea fc|\bchelsea\b|tottenham|spurs\b|newcastle united|west ham|aston villa|brighton|crystal palace|wolverhampton|wolves\b|nottingham forest|bournemouth|fulham|brentford|everton|ipswich|leicester|southampton)\b/i,
  ],
  ['la-liga', /\b(la liga|real madrid|fc barcelona|atletico madrid|atlético madrid|sevilla fc|real sociedad|villarreal)\b/i],
  ['serie-a', /\b(serie a|juventus|inter milan|ac milan|ssc napoli|as roma|atalanta|lazio|fiorentina)\b/i],
  ['bundesliga', /\b(bundesliga|bayern munich|borussia dortmund|bvb|rb leipzig|bayer leverkusen|eintracht frankfurt)\b/i],
  ['champions-league', /\b(champions league|uefa champions|europa league|europa conference)\b/i],
];

/** Merge source defaults with keyword inference from title/excerpt. */
export function inferSportTags(text: string, baseTags: SportTag[] = []): SportTag[] {
  const inferred = new Set<SportTag>(baseTags);

  for (const [tag, pattern] of SPORT_INFERENCE_RULES) {
    if (pattern.test(text)) inferred.add(tag);
  }

  // "Football" alone usually means association football; NFL-specific terms route to American football.
  if (/\bfootball\b/i.test(text)) {
    if (NFL_INFERENCE_PATTERN.test(text)) {
      inferred.add('football');
    } else {
      inferred.add('soccer');
    }
  }

  for (const league of LEAGUE_TAGS) {
    if (inferred.has(league)) inferred.add('soccer');
  }

  return SPORT_TAG_ORDER.filter((tag) => inferred.has(tag));
}
