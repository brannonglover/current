import { WORLD_CUP_TAB_ENABLED } from '@/constants/worldCup';
import {
  cancelScheduledNotification,
  getScheduledNotificationIdentifiers,
  notificationsAvailable,
} from '@/services/notificationSetup';
import { isWorldCupNotificationIdentifier } from '@/services/worldCupMatchNotifications';
import type { WorldCupMatch } from '@/services/worldCupFeed';

/** Cancel every scheduled World Cup match notification. */
export async function cancelWorldCupMatchNotifications(): Promise<void> {
  if (!notificationsAvailable()) return;

  const identifiers = await getScheduledNotificationIdentifiers();
  await Promise.all(
    identifiers
      .filter(isWorldCupNotificationIdentifier)
      .map((identifier) => cancelScheduledNotification(identifier)),
  );
}

/**
 * Clears any legacy World Cup match alerts. Kickoff/reminder scheduling is disabled —
 * notifications are limited to breaking/pressing news and liked-content picks.
 */
export async function syncWorldCupMatchNotifications(
  _matches: WorldCupMatch[],
  _enabled: boolean,
): Promise<void> {
  if (!WORLD_CUP_TAB_ENABLED || !notificationsAvailable()) return;
  await cancelWorldCupMatchNotifications();
}
