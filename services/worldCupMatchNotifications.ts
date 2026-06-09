import {
  WORLD_CUP_MATCH_REMINDER_MINUTES,
  WORLD_CUP_NOTIFICATION_ID_PREFIX,
} from '@/constants/worldCup';
import type { WorldCupMatch } from '@/services/worldCupFeed';

export type WorldCupMatchNotificationKind = 'reminder' | 'kickoff';

export interface WorldCupMatchNotificationRequest {
  identifier: string;
  matchId: string;
  kind: WorldCupMatchNotificationKind;
  triggerAt: Date;
  title: string;
  body: string;
}

export function worldCupNotificationIdentifier(
  matchId: string,
  kind: WorldCupMatchNotificationKind,
): string {
  return `${WORLD_CUP_NOTIFICATION_ID_PREFIX}${matchId}-${kind}`;
}

export function isWorldCupNotificationIdentifier(identifier: string): boolean {
  return identifier.startsWith(WORLD_CUP_NOTIFICATION_ID_PREFIX);
}

export function formatMatchNotificationLabel(home: string, away: string): string {
  return `${home} vs ${away}`;
}

/** Upcoming fixtures only — skip live, final, and already-started matches. */
export function selectSchedulableWorldCupMatches(
  matches: WorldCupMatch[],
  now: Date,
): WorldCupMatch[] {
  const nowMs = now.getTime();

  return matches.filter((match) => {
    if (match.isLive || match.isFinal) return false;
    return new Date(match.startTime).getTime() > nowMs;
  });
}

/** Build kickoff + optional reminder notifications for upcoming World Cup fixtures. */
export function buildWorldCupMatchNotificationRequests(
  matches: WorldCupMatch[],
  now: Date,
  options?: { reminderMinutes?: number },
): WorldCupMatchNotificationRequest[] {
  const reminderMinutes = options?.reminderMinutes ?? WORLD_CUP_MATCH_REMINDER_MINUTES;
  const requests: WorldCupMatchNotificationRequest[] = [];

  for (const match of selectSchedulableWorldCupMatches(matches, now)) {
    const kickoff = new Date(match.startTime);
    const label = formatMatchNotificationLabel(match.home.name, match.away.name);

    requests.push({
      identifier: worldCupNotificationIdentifier(match.id, 'kickoff'),
      matchId: match.id,
      kind: 'kickoff',
      triggerAt: kickoff,
      title: 'Match kicking off',
      body: `${label} is starting now.`,
    });

    const reminderAt = new Date(kickoff.getTime() - reminderMinutes * 60_000);
    if (reminderAt.getTime() > now.getTime()) {
      requests.push({
        identifier: worldCupNotificationIdentifier(match.id, 'reminder'),
        matchId: match.id,
        kind: 'reminder',
        triggerAt: reminderAt,
        title: 'Match starting soon',
        body: `${label} kicks off in ${reminderMinutes} minutes.`,
      });
    }
  }

  return requests.sort((a, b) => a.triggerAt.getTime() - b.triggerAt.getTime());
}
