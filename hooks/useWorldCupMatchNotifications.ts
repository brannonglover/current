import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';

import { WORLD_CUP_TAB_ENABLED } from '@/constants/worldCup';
import {
  getNotificationPermissionGranted,
  notificationsAvailable,
  requestTrendingNotificationPermission,
} from '@/services/notificationSetup';
import {
  getWorldCupMatchNotificationsEnabled,
  setWorldCupMatchNotificationsEnabled,
} from '@/services/worldCupNotificationPrefs';
import {
  cancelWorldCupMatchNotifications,
  syncWorldCupMatchNotifications,
} from '@/services/worldCupNotificationScheduler';
import type { WorldCupMatch } from '@/services/worldCupFeed';

export type WorldCupMatchNotificationsToggleResult = 'updated' | 'denied' | 'unavailable';

/** Loads opt-in state and keeps scheduled match alerts in sync with ESPN fixtures. */
export function useWorldCupMatchNotifications(matches: WorldCupMatch[]) {
  const [enabled, setEnabled] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!WORLD_CUP_TAB_ENABLED || Platform.OS === 'web') {
      setLoaded(true);
      return;
    }

    void getWorldCupMatchNotificationsEnabled().then((value) => {
      setEnabled(value);
      setLoaded(true);
    });
  }, []);

  useEffect(() => {
    if (!WORLD_CUP_TAB_ENABLED || Platform.OS === 'web' || !loaded || !enabled) return;
    void syncWorldCupMatchNotifications(matches, true);
  }, [matches, enabled, loaded]);

  const setMatchNotificationsEnabled = useCallback(
    async (nextEnabled: boolean): Promise<WorldCupMatchNotificationsToggleResult> => {
      if (!WORLD_CUP_TAB_ENABLED || Platform.OS === 'web' || !notificationsAvailable()) {
        return 'unavailable';
      }

      if (!nextEnabled) {
        await setWorldCupMatchNotificationsEnabled(false);
        await cancelWorldCupMatchNotifications();
        setEnabled(false);
        return 'updated';
      }

      const permission = await requestTrendingNotificationPermission();
      if (permission === 'unavailable') return 'unavailable';
      if (permission === 'denied') return 'denied';

      await setWorldCupMatchNotificationsEnabled(true);
      setEnabled(true);

      if (await getNotificationPermissionGranted()) {
        await syncWorldCupMatchNotifications(matches, true);
      }

      return 'updated';
    },
    [matches],
  );

  return {
    matchNotificationsEnabled: enabled,
    matchNotificationsLoaded: loaded,
    setMatchNotificationsEnabled,
  };
}
