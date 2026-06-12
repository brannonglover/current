import { decodeFeedText, stripAndDecodeHtml } from '@/catalog/decodeHtmlText';
import {
  WORLD_CUP_BRACKET_DATES,
  WORLD_CUP_FETCH_TIMEOUT_MS,
  WORLD_CUP_NEWS_FEEDS,
  WORLD_CUP_SCOREBOARD_DAYS,
  WORLD_CUP_SCOREBOARD_URL,
  WORLD_CUP_STANDINGS_URL,
  WORLD_CUP_SUMMARY_URL,
} from '@/constants/worldCup';

export interface WorldCupMatchTeam {
  name: string;
  abbrev: string;
  score: string;
  logoUrl?: string;
  winner: boolean;
}

export interface WorldCupMatchEvent {
  type: string;
  clock: string;
  playerName?: string;
  side: 'home' | 'away';
  isPenalty: boolean;
  isOwnGoal: boolean;
  isShootout: boolean;
}

export interface WorldCupTeamStats {
  possession?: string;
  shots?: string;
  shotsOnTarget?: string;
  fouls?: string;
  corners?: string;
}

export interface WorldCupHalfScore {
  label: string;
  home: string;
  away: string;
}

export interface WorldCupMatch {
  id: string;
  startTime: string;
  status: string;
  statusDetail: string;
  isLive: boolean;
  isFinal: boolean;
  venue?: string;
  roundSlug?: string;
  home: WorldCupMatchTeam;
  away: WorldCupMatchTeam;
  events?: WorldCupMatchEvent[];
  teamStats?: {
    home: WorldCupTeamStats;
    away: WorldCupTeamStats;
  };
}

export interface WorldCupBracketRound {
  slug: string;
  label: string;
  detail?: string;
  matches: WorldCupMatch[];
}

export interface WorldCupGroupTeam {
  name: string;
  abbrev: string;
  logoUrl?: string;
  played: number;
  wins: number;
  draws: number;
  losses: number;
  goalDiff: number;
  points: number;
}

export interface WorldCupGroup {
  name: string;
  teams: WorldCupGroupTeam[];
}

export interface WorldCupUpdate {
  id: string;
  title: string;
  excerpt: string;
  url: string;
  source: string;
  publishedAt: string;
  imageUrl?: string;
}

export interface WorldCupFeedResult {
  matches: WorldCupMatch[];
  updates: WorldCupUpdate[];
  groups: WorldCupGroup[];
  bracket: WorldCupBracketRound[];
  error?: string;
}

interface EspnScoreboardResponse {
  events?: EspnEvent[];
  leagues?: EspnLeague[];
}

const KNOCKOUT_ROUND_ORDER = [
  'round-of-32',
  'round-of-16',
  'quarterfinals',
  'semifinals',
  '3rd-place-match',
  'final',
] as const;

const KNOCKOUT_ROUND_SLUGS = new Set<string>(KNOCKOUT_ROUND_ORDER);

const DEFAULT_ROUND_LABELS: Record<string, string> = {
  'round-of-32': 'Round of 32',
  'round-of-16': 'Round of 16',
  quarterfinals: 'Quarterfinals',
  semifinals: 'Semifinals',
  '3rd-place-match': '3rd-Place Match',
  final: 'Final',
};

interface EspnEvent {
  id: string;
  date: string;
  season?: { slug?: string };
  competitions?: EspnCompetition[];
}

interface EspnCalendarEntry {
  label?: string;
  detail?: string;
  value?: string;
}

interface EspnLeague {
  calendar?: { entries?: EspnCalendarEntry[] }[];
}

interface EspnCompetition {
  venue?: { fullName?: string };
  status?: { type?: EspnStatusType };
  competitors?: EspnCompetitor[];
  details?: EspnMatchDetail[];
}

interface EspnMatchDetail {
  type?: { text?: string };
  clock?: { displayValue?: string };
  team?: { id?: string };
  penaltyKick?: boolean;
  ownGoal?: boolean;
  shootout?: boolean;
  athletesInvolved?: { displayName?: string }[];
}

interface EspnLinescore {
  displayValue?: string;
}

interface EspnSummaryResponse {
  header?: {
    competitions?: {
      competitors?: {
        homeAway?: string;
        linescores?: EspnLinescore[];
      }[];
    }[];
  };
}

interface EspnStatusType {
  state?: string;
  description?: string;
  shortDetail?: string;
  detail?: string;
  completed?: boolean;
}

interface EspnCompetitor {
  homeAway?: string;
  score?: string;
  winner?: boolean;
  team?: {
    id?: string;
    displayName?: string;
    abbreviation?: string;
    logos?: { href?: string }[];
  };
  statistics?: { name?: string; displayValue?: string }[];
}

interface EspnStandingEntry {
  team?: {
    displayName?: string;
    abbreviation?: string;
    logos?: { href?: string }[];
  };
  stats?: { name?: string; displayValue?: string; value?: number }[];
}

interface EspnStandingsResponse {
  children?: {
    name?: string;
    standings?: { entries?: EspnStandingEntry[] };
  }[];
}

async function fetchWithTimeout(url: string, timeoutMs = WORLD_CUP_FETCH_TIMEOUT_MS): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

  try {
    return await fetch(url, {
      signal: controller.signal,
      headers: { Accept: 'application/json, application/rss+xml, application/xml, text/xml, */*' },
    });
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Request timed out. Check your connection and try again.');
    }
    throw error;
  } finally {
    clearTimeout(timeoutId);
  }
}

function formatEspnDateRange(days: number): string {
  const start = new Date();
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + Math.max(0, days - 1));

  const fmt = (d: Date) =>
    `${d.getUTCFullYear()}${String(d.getUTCMonth() + 1).padStart(2, '0')}${String(d.getUTCDate()).padStart(2, '0')}`;

  return `${fmt(start)}-${fmt(end)}`;
}

function teamFromCompetitor(competitor: EspnCompetitor): WorldCupMatchTeam {
  const team = competitor.team ?? {};
  const displayName = team.displayName?.trim();
  const abbreviation = team.abbreviation?.trim();
  const fallbackName = displayName || abbreviation || 'TBD';

  return {
    name: fallbackName,
    abbrev: abbreviation || fallbackName.slice(0, 3).toUpperCase(),
    score: competitor.score ?? '0',
    logoUrl: team.logos?.[0]?.href,
    winner: competitor.winner === true,
  };
}

function competitorStat(competitor: EspnCompetitor, name: string): string | undefined {
  const stat = competitor.statistics?.find((item) => item.name === name);
  const value = stat?.displayValue?.trim();
  return value || undefined;
}

function teamStatsFromCompetitor(competitor: EspnCompetitor): WorldCupTeamStats {
  const possession = competitorStat(competitor, 'possessionPct');
  return {
    possession: possession ? `${possession}%` : undefined,
    shots: competitorStat(competitor, 'totalShots'),
    shotsOnTarget: competitorStat(competitor, 'shotsOnTarget'),
    fouls: competitorStat(competitor, 'foulsCommitted'),
    corners: competitorStat(competitor, 'wonCorners'),
  };
}

function hasTeamStats(stats: WorldCupTeamStats): boolean {
  return Object.values(stats).some((value) => value !== undefined);
}

const HALF_SCORE_LABELS = ['1st Half', '2nd Half', 'Extra Time', 'Penalties'] as const;

function parseMatchEvents(
  details: EspnMatchDetail[] | undefined,
  homeTeamId: string | undefined,
  awayTeamId: string | undefined,
): WorldCupMatchEvent[] {
  const events: WorldCupMatchEvent[] = [];

  for (const detail of details ?? []) {
    const type = detail.type?.text?.trim();
    const clock = detail.clock?.displayValue?.trim();
    if (!type || !clock) continue;

    const teamId = detail.team?.id;
    let side: 'home' | 'away' = 'home';
    if (teamId && awayTeamId && teamId === awayTeamId) {
      side = 'away';
    } else if (teamId && homeTeamId && teamId !== homeTeamId) {
      side = 'away';
    }

    events.push({
      type,
      clock,
      playerName: detail.athletesInvolved?.[0]?.displayName?.trim(),
      side,
      isPenalty: detail.penaltyKick === true,
      isOwnGoal: detail.ownGoal === true,
      isShootout: detail.shootout === true,
    });
  }

  return events;
}

/** Parse half-by-half scores from the ESPN match summary header. */
export function parseEspnMatchHalfScores(data: EspnSummaryResponse): WorldCupHalfScore[] {
  const competitors = data.header?.competitions?.[0]?.competitors ?? [];
  const home = competitors.find((competitor) => competitor.homeAway === 'home');
  const away = competitors.find((competitor) => competitor.homeAway === 'away');
  if (!home?.linescores?.length || !away?.linescores?.length) return [];

  const halfCount = Math.min(home.linescores.length, away.linescores.length);
  const halfScores: WorldCupHalfScore[] = [];

  for (let index = 0; index < halfCount; index += 1) {
    const homeScore = home.linescores[index]?.displayValue?.trim();
    const awayScore = away.linescores[index]?.displayValue?.trim();
    if (homeScore === undefined || awayScore === undefined) continue;

    halfScores.push({
      label: HALF_SCORE_LABELS[index] ?? `Period ${index + 1}`,
      home: homeScore,
      away: awayScore,
    });
  }

  return halfScores;
}

function matchFromEvent(event: EspnEvent): WorldCupMatch | null {
  const competition = event.competitions?.[0];
  if (!competition) return null;

  const competitors = competition.competitors ?? [];
  const homeComp = competitors.find((c) => c.homeAway === 'home') ?? competitors[0];
  const awayComp = competitors.find((c) => c.homeAway === 'away') ?? competitors[1];
  if (!homeComp || !awayComp) return null;

  const status = competition.status?.type ?? {};
  const state = status.state ?? 'pre';
  const isLive = state === 'in';
  const isFinal = state === 'post' || status.completed === true;

  const homeStats = teamStatsFromCompetitor(homeComp);
  const awayStats = teamStatsFromCompetitor(awayComp);
  const events = parseMatchEvents(
    competition.details,
    homeComp.team?.id,
    awayComp.team?.id,
  );

  return {
    id: event.id,
    startTime: event.date,
    status: status.description ?? 'Scheduled',
    statusDetail: status.shortDetail ?? status.detail ?? '',
    isLive,
    isFinal,
    venue: competition.venue?.fullName,
    roundSlug: event.season?.slug,
    home: teamFromCompetitor(homeComp),
    away: teamFromCompetitor(awayComp),
    events: events.length > 0 ? events : undefined,
    teamStats:
      hasTeamStats(homeStats) || hasTeamStats(awayStats)
        ? { home: homeStats, away: awayStats }
        : undefined,
  };
}

function standingStat(entry: EspnStandingEntry, name: string): number {
  const stat = entry.stats?.find((item) => item.name === name);
  if (!stat) return 0;
  const parsed = Number(stat.displayValue ?? stat.value);
  return Number.isFinite(parsed) ? parsed : 0;
}

/** Parse ESPN group standings into group-stage bracket cards. */
export function parseEspnStandings(data: EspnStandingsResponse): WorldCupGroup[] {
  const groups: WorldCupGroup[] = [];

  for (const child of data.children ?? []) {
    const name = child.name?.trim();
    if (!name) continue;

    const entries = [...(child.standings?.entries ?? [])].sort(
      (a, b) =>
        standingStat(a, 'rank') - standingStat(b, 'rank') ||
        standingStat(b, 'points') - standingStat(a, 'points') ||
        standingStat(b, 'pointDifferential') - standingStat(a, 'pointDifferential'),
    );

    const teams = entries.map((entry) => {
      const team = entry.team ?? {};
      return {
        name: team.displayName ?? team.abbreviation ?? 'TBD',
        abbrev: team.abbreviation ?? '—',
        logoUrl: team.logos?.[0]?.href,
        played: standingStat(entry, 'gamesPlayed'),
        wins: standingStat(entry, 'wins'),
        draws: standingStat(entry, 'ties'),
        losses: standingStat(entry, 'losses'),
        goalDiff: standingStat(entry, 'pointDifferential'),
        points: standingStat(entry, 'points'),
      };
    });

    if (teams.length > 0) {
      groups.push({ name, teams });
    }
  }

  return groups.sort((a, b) =>
    a.name.localeCompare(b.name, undefined, { numeric: true, sensitivity: 'base' }),
  );
}

/** Parse ESPN FIFA World Cup scoreboard JSON into match rows. */
export function parseEspnScoreboard(data: EspnScoreboardResponse): WorldCupMatch[] {
  const matches: WorldCupMatch[] = [];

  for (const event of data.events ?? []) {
    const match = matchFromEvent(event);
    if (match) matches.push(match);
  }

  return matches.sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );
}

function normalizeRoundSlug(label: string): string | undefined {
  const lower = label.toLowerCase();
  if (lower.includes('round of 32')) return 'round-of-32';
  if (lower.includes('rd of 16') || lower.includes('round of 16')) return 'round-of-16';
  if (lower.includes('quarter')) return 'quarterfinals';
  if (lower.includes('semi')) return 'semifinals';
  if (lower.includes('3rd') || lower.includes('third')) return '3rd-place-match';
  if (lower === 'final') return 'final';
  return undefined;
}

/** Map ESPN calendar entries to knockout round labels and date ranges. */
export function parseEspnBracketCalendar(leagues: EspnLeague[] = []): Map<string, { label: string; detail?: string }> {
  const bySlug = new Map<string, { label: string; detail?: string }>();

  for (const league of leagues) {
    for (const calendar of league.calendar ?? []) {
      for (const entry of calendar.entries ?? []) {
        const label = entry.label?.trim();
        if (!label) continue;
        const slug = normalizeRoundSlug(label);
        if (!slug || !KNOCKOUT_ROUND_SLUGS.has(slug)) continue;
        bySlug.set(slug, { label, detail: entry.detail?.trim() });
      }
    }
  }

  return bySlug;
}

/** Group knockout fixtures into bracket rounds for horizontal display. */
export function parseEspnBracket(data: EspnScoreboardResponse): WorldCupBracketRound[] {
  const calendarBySlug = parseEspnBracketCalendar(data.leagues);
  const matches = parseEspnScoreboard(data).filter(
    (match) => match.roundSlug && KNOCKOUT_ROUND_SLUGS.has(match.roundSlug),
  );

  const bySlug = new Map<string, WorldCupMatch[]>();
  for (const match of matches) {
    const slug = match.roundSlug!;
    const bucket = bySlug.get(slug) ?? [];
    bucket.push(match);
    bySlug.set(slug, bucket);
  }

  return KNOCKOUT_ROUND_ORDER.flatMap((slug) => {
    const roundMatches = bySlug.get(slug);
    if (!roundMatches?.length) return [];

    const calendar = calendarBySlug.get(slug);
    return [
      {
        slug,
        label: calendar?.label ?? DEFAULT_ROUND_LABELS[slug] ?? slug,
        detail: calendar?.detail,
        matches: roundMatches,
      },
    ];
  });
}

function extractRssTag(block: string, tag: string): string {
  const cdata = new RegExp(`<${tag}[^>]*><!\\[CDATA\\[([\\s\\S]*?)\\]\\]><\\/${tag}>`, 'i');
  const plain = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'i');
  const match = block.match(cdata) ?? block.match(plain);
  return match?.[1]?.trim() ?? '';
}

function extractRssThumbnail(block: string): string | undefined {
  const media = block.match(/<media:thumbnail[^>]*\surl="([^"]+)"/i);
  if (media?.[1]) return media[1];

  const content = block.match(/<media:content[^>]*\surl="([^"]+)"/i);
  return content?.[1];
}

function parseRssDate(value: string): string {
  const parsed = Date.parse(value);
  return Number.isFinite(parsed) ? new Date(parsed).toISOString() : new Date(0).toISOString();
}

/** Parse RSS 2.0 XML into World Cup news updates. */
export function parseWorldCupRss(xml: string, source: string): WorldCupUpdate[] {
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  const updates: WorldCupUpdate[] = [];

  for (const block of items) {
    const title = stripAndDecodeHtml(extractRssTag(block, 'title'));
    const link = decodeFeedText(extractRssTag(block, 'link'));
    const guid = decodeFeedText(extractRssTag(block, 'guid'));
    const pubDate = extractRssTag(block, 'pubDate');
    const description = stripAndDecodeHtml(extractRssTag(block, 'description'));
    const imageUrl = extractRssThumbnail(block);

    if (!title || !link) continue;

    updates.push({
      id: guid || link,
      title,
      excerpt: description,
      url: link,
      source,
      publishedAt: parseRssDate(pubDate),
      imageUrl,
    });
  }

  return updates;
}

function mergeUpdates(feedUpdates: WorldCupUpdate[][]): WorldCupUpdate[] {
  const byUrl = new Map<string, WorldCupUpdate>();

  for (const batch of feedUpdates) {
    for (const item of batch) {
      if (!byUrl.has(item.url)) {
        byUrl.set(item.url, item);
      }
    }
  }

  return [...byUrl.values()].sort(
    (a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

async function fetchScoreboard(dates?: string): Promise<WorldCupMatch[]> {
  const range = dates ?? formatEspnDateRange(WORLD_CUP_SCOREBOARD_DAYS);
  const url = `${WORLD_CUP_SCOREBOARD_URL}?dates=${range}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Scores unavailable (HTTP ${response.status})`);
  }
  const data = (await response.json()) as EspnScoreboardResponse;
  return parseEspnScoreboard(data);
}

async function fetchGroupStandings(): Promise<WorldCupGroup[]> {
  const response = await fetchWithTimeout(WORLD_CUP_STANDINGS_URL);
  if (!response.ok) {
    throw new Error(`Standings unavailable (HTTP ${response.status})`);
  }
  const data = (await response.json()) as EspnStandingsResponse;
  return parseEspnStandings(data);
}

async function fetchBracket(): Promise<WorldCupBracketRound[]> {
  const url = `${WORLD_CUP_SCOREBOARD_URL}?dates=${WORLD_CUP_BRACKET_DATES}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Bracket unavailable (HTTP ${response.status})`);
  }
  const data = (await response.json()) as EspnScoreboardResponse;
  return parseEspnBracket(data);
}

async function fetchNewsUpdates(): Promise<WorldCupUpdate[]> {
  const batches = await Promise.all(
    WORLD_CUP_NEWS_FEEDS.map(async (feed) => {
      try {
        const response = await fetchWithTimeout(feed.url);
        if (!response.ok) return [];
        const xml = await response.text();
        return parseWorldCupRss(xml, feed.name);
      } catch {
        return [];
      }
    }),
  );

  return mergeUpdates(batches);
}

/** True when at least one fixture is in progress. */
export function hasLiveMatches(matches: WorldCupMatch[]): boolean {
  return matches.some((match) => match.isLive);
}

/** Pin live fixtures to the top of the Scores tab, then sort by kickoff. */
export function sortMatchesForScores(matches: WorldCupMatch[]): WorldCupMatch[] {
  return [...matches].sort((a, b) => {
    if (a.isLive !== b.isLive) return a.isLive ? -1 : 1;
    return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
  });
}

/** Load half-by-half scores for a fixture (ESPN summary API). */
export async function fetchWorldCupMatchHalfScores(matchId: string): Promise<WorldCupHalfScore[]> {
  const url = `${WORLD_CUP_SUMMARY_URL}?event=${encodeURIComponent(matchId)}`;
  const response = await fetchWithTimeout(url);
  if (!response.ok) {
    throw new Error(`Match summary unavailable (HTTP ${response.status})`);
  }
  const data = (await response.json()) as EspnSummaryResponse;
  return parseEspnMatchHalfScores(data);
}

/** Load scores, bracket, and news for the temporary World Cup tab. */
export async function fetchWorldCupFeed(): Promise<WorldCupFeedResult> {
  const errors: string[] = [];

  const [matchesResult, groupsResult, bracketResult, updatesResult] = await Promise.allSettled([
    fetchScoreboard(),
    fetchGroupStandings(),
    fetchBracket(),
    fetchNewsUpdates(),
  ]);

  const matches = matchesResult.status === 'fulfilled' ? matchesResult.value : [];
  if (matchesResult.status === 'rejected') {
    errors.push(
      matchesResult.reason instanceof Error
        ? matchesResult.reason.message
        : 'Could not load scores',
    );
  }

  const groups = groupsResult.status === 'fulfilled' ? groupsResult.value : [];
  if (groupsResult.status === 'rejected') {
    errors.push(
      groupsResult.reason instanceof Error
        ? groupsResult.reason.message
        : 'Could not load group standings',
    );
  }

  const bracket = bracketResult.status === 'fulfilled' ? bracketResult.value : [];
  if (bracketResult.status === 'rejected') {
    errors.push(
      bracketResult.reason instanceof Error
        ? bracketResult.reason.message
        : 'Could not load bracket',
    );
  }

  const updates = updatesResult.status === 'fulfilled' ? updatesResult.value : [];
  if (updatesResult.status === 'rejected') {
    errors.push(
      updatesResult.reason instanceof Error
        ? updatesResult.reason.message
        : 'Could not load news',
    );
  }

  if (matches.length === 0 && updates.length === 0 && groups.length === 0 && bracket.length === 0) {
    return {
      matches,
      updates,
      groups,
      bracket,
      error: errors[0] ?? 'Nothing to show right now. Pull to refresh.',
    };
  }

  return {
    matches,
    updates,
    groups,
    bracket,
    error: errors.length > 0 ? errors.join(' · ') : undefined,
  };
}
