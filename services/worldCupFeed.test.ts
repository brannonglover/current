import assert from 'node:assert/strict';

import {
  hasLiveMatches,
  parseEspnBracket,
  parseEspnBracketCalendar,
  parseEspnScoreboard,
  parseEspnStandings,
  parseWorldCupRss,
  sortMatchesForScores,
} from '@/services/worldCupFeed';

function run(label: string, fn: () => void) {
  try {
    fn();
    console.log(`ok ${label}`);
  } catch (error) {
    console.error(`fail ${label}`);
    throw error;
  }
}

const SAMPLE_SCOREBOARD = {
  events: [
    {
      id: '760415',
      date: '2026-06-11T19:00Z',
      competitions: [
        {
          venue: { fullName: 'Estadio Banorte' },
          status: {
            type: {
              state: 'pre',
              description: 'Scheduled',
              shortDetail: 'Thu, June 11th at 3:00 PM EDT',
            },
          },
          competitors: [
            {
              homeAway: 'home',
              score: '0',
              winner: false,
              team: {
                displayName: 'Mexico',
                abbreviation: 'MEX',
                logos: [{ href: 'https://example.com/mex.png' }],
              },
            },
            {
              homeAway: 'away',
              score: '0',
              winner: false,
              team: {
                displayName: 'South Africa',
                abbreviation: 'RSA',
              },
            },
          ],
        },
      ],
    },
    {
      id: '760416',
      date: '2026-06-10T19:00Z',
      competitions: [
        {
          status: {
            type: {
              state: 'post',
              description: 'Final',
              shortDetail: 'FT',
              completed: true,
            },
          },
          competitors: [
            {
              homeAway: 'home',
              score: '2',
              winner: true,
              team: { displayName: 'France', abbreviation: 'FRA' },
            },
            {
              homeAway: 'away',
              score: '1',
              winner: false,
              team: { displayName: 'Brazil', abbreviation: 'BRA' },
            },
          ],
        },
      ],
    },
  ],
};

const SAMPLE_RSS = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:media="http://search.yahoo.com/mrss/">
  <channel>
    <item>
      <title><![CDATA[World Cup opener preview]]></title>
      <description><![CDATA[Mexico host South Africa in the opening match.]]></description>
      <link>https://example.com/world-cup-opener</link>
      <guid>https://example.com/world-cup-opener</guid>
      <pubDate>Tue, 09 Jun 2026 17:55:45 GMT</pubDate>
      <media:thumbnail url="https://example.com/thumb.jpg"/>
    </item>
  </channel>
</rss>`;

run('parseEspnScoreboard maps teams and sorts by kickoff', () => {
  const matches = parseEspnScoreboard(SAMPLE_SCOREBOARD);
  assert.equal(matches.length, 2);
  assert.equal(matches[0]?.id, '760416');
  assert.equal(matches[1]?.home.name, 'Mexico');
  assert.equal(matches[1]?.away.abbrev, 'RSA');
  assert.equal(matches[1]?.venue, 'Estadio Banorte');
  assert.equal(matches[0]?.isFinal, true);
  assert.equal(matches[1]?.isLive, false);
});

run('parseWorldCupRss extracts title, link, excerpt, and thumbnail', () => {
  const updates = parseWorldCupRss(SAMPLE_RSS, 'BBC Sport');
  assert.equal(updates.length, 1);
  assert.equal(updates[0]?.title, 'World Cup opener preview');
  assert.equal(updates[0]?.source, 'BBC Sport');
  assert.equal(updates[0]?.url, 'https://example.com/world-cup-opener');
  assert.match(updates[0]?.excerpt ?? '', /opening match/);
  assert.equal(updates[0]?.imageUrl, 'https://example.com/thumb.jpg');
});

const SAMPLE_BRACKET = {
  leagues: [
    {
      calendar: [
        {
          entries: [
            { label: 'Round of 32', detail: 'Jun 28-Jul 3', value: '2' },
            { label: 'Final', detail: 'Jul 19', value: '7' },
          ],
        },
      ],
    },
  ],
  events: [
    {
      id: '760486',
      date: '2026-06-28T19:00Z',
      season: { slug: 'round-of-32' },
      competitions: [
        {
          status: { type: { state: 'pre', description: 'Scheduled', shortDetail: 'Scheduled' } },
          competitors: [
            {
              homeAway: 'home',
              score: '0',
              winner: false,
              team: { displayName: 'Group A 2nd Place', abbreviation: '2A' },
            },
            {
              homeAway: 'away',
              score: '0',
              winner: false,
              team: { displayName: 'Group B 2nd Place', abbreviation: '2B' },
            },
          ],
        },
      ],
    },
    {
      id: '760999',
      date: '2026-07-19T19:00Z',
      season: { slug: 'final' },
      competitions: [
        {
          status: {
            type: { state: 'post', description: 'Final', shortDetail: 'FT', completed: true },
          },
          competitors: [
            {
              homeAway: 'home',
              score: '2',
              winner: true,
              team: { displayName: 'France', abbreviation: 'FRA' },
            },
            {
              homeAway: 'away',
              score: '1',
              winner: false,
              team: { displayName: 'Brazil', abbreviation: 'BRA' },
            },
          ],
        },
      ],
    },
    {
      id: '760415',
      date: '2026-06-11T19:00Z',
      season: { slug: 'group-stage' },
      competitions: [
        {
          status: { type: { state: 'pre', description: 'Scheduled' } },
          competitors: [
            {
              homeAway: 'home',
              score: '0',
              team: { displayName: 'Mexico', abbreviation: 'MEX' },
            },
            {
              homeAway: 'away',
              score: '0',
              team: { displayName: 'South Africa', abbreviation: 'RSA' },
            },
          ],
        },
      ],
    },
  ],
};

run('parseEspnBracketCalendar maps knockout round labels', () => {
  const calendar = parseEspnBracketCalendar(SAMPLE_BRACKET.leagues);
  assert.equal(calendar.get('round-of-32')?.label, 'Round of 32');
  assert.equal(calendar.get('round-of-32')?.detail, 'Jun 28-Jul 3');
  assert.equal(calendar.get('final')?.label, 'Final');
});

run('parseEspnBracket groups knockout fixtures and skips group stage', () => {
  const rounds = parseEspnBracket(SAMPLE_BRACKET);
  assert.equal(rounds.length, 2);
  assert.equal(rounds[0]?.slug, 'round-of-32');
  assert.equal(rounds[0]?.label, 'Round of 32');
  assert.equal(rounds[0]?.matches.length, 1);
  assert.equal(rounds[1]?.slug, 'final');
  assert.equal(rounds[1]?.matches[0]?.home.name, 'France');
  assert.equal(rounds[1]?.matches[0]?.isFinal, true);
});

const SAMPLE_STANDINGS = {
  children: [
    {
      name: 'Group A',
      standings: {
        entries: [
          {
            team: {
              displayName: 'Mexico',
              abbreviation: 'MEX',
              logos: [{ href: 'https://example.com/mex.png' }],
            },
            stats: [
              { name: 'gamesPlayed', displayValue: '2' },
              { name: 'wins', displayValue: '2' },
              { name: 'ties', displayValue: '0' },
              { name: 'losses', displayValue: '0' },
              { name: 'pointDifferential', displayValue: '3' },
              { name: 'points', displayValue: '6' },
            ],
          },
          {
            team: { displayName: 'South Africa', abbreviation: 'RSA' },
            stats: [
              { name: 'gamesPlayed', displayValue: '2' },
              { name: 'wins', displayValue: '0' },
              { name: 'ties', displayValue: '1' },
              { name: 'losses', displayValue: '1' },
              { name: 'pointDifferential', displayValue: '-2' },
              { name: 'points', displayValue: '1' },
            ],
          },
        ],
      },
    },
  ],
};

run('parseEspnStandings maps group tables with stats', () => {
  const groups = parseEspnStandings(SAMPLE_STANDINGS);
  assert.equal(groups.length, 1);
  assert.equal(groups[0]?.name, 'Group A');
  assert.equal(groups[0]?.teams[0]?.abbrev, 'MEX');
  assert.equal(groups[0]?.teams[0]?.points, 6);
  assert.equal(groups[0]?.teams[0]?.goalDiff, 3);
  assert.equal(groups[0]?.teams[1]?.points, 1);
});

run('hasLiveMatches is true only when a fixture is in progress', () => {
  const matches = parseEspnScoreboard(SAMPLE_SCOREBOARD);
  assert.equal(hasLiveMatches(matches), false);

  const live = parseEspnScoreboard({
    events: [
      {
        id: 'live-1',
        date: '2026-06-11T19:00Z',
        competitions: [
          {
            status: {
              type: { state: 'in', description: '1st Half', shortDetail: "23'" },
            },
            competitors: [
              { homeAway: 'home', score: '1', team: { displayName: 'Mexico', abbreviation: 'MEX' } },
              { homeAway: 'away', score: '0', team: { displayName: 'Brazil', abbreviation: 'BRA' } },
            ],
          },
        ],
      },
    ],
  });
  assert.equal(hasLiveMatches(live), true);
});

run('sortMatchesForScores pins live fixtures ahead of kickoff order', () => {
  const scheduledLater = {
    id: 'later',
    startTime: '2026-06-12T19:00Z',
    status: 'Scheduled',
    statusDetail: '',
    isLive: false,
    isFinal: false,
    home: { name: 'A', abbrev: 'A', score: '0', winner: false },
    away: { name: 'B', abbrev: 'B', score: '0', winner: false },
  };
  const scheduledEarlier = {
    ...scheduledLater,
    id: 'earlier',
    startTime: '2026-06-11T19:00Z',
  };
  const live = {
    ...scheduledLater,
    id: 'live',
    startTime: '2026-06-13T19:00Z',
    status: '1st Half',
    isLive: true,
  };

  const sorted = sortMatchesForScores([scheduledLater, live, scheduledEarlier]);
  assert.deepEqual(
    sorted.map((match) => match.id),
    ['live', 'earlier', 'later'],
  );
});
