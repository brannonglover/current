import { useEffect, useRef } from 'react';
import { AppState, AppStateStatus, Platform } from 'react-native';

import { useAuth } from '@/contexts/AuthContext';
import { usePreferences } from '@/contexts/PreferencesContext';
import {
  runTrendingNotificationCheck,
  syncTrendingNotificationBackgroundTask,
} from '@/services/trendingNotificationTask';

/** Registers periodic background checks and runs one when the app backgrounds. */
export function useTrendingNotificationBackground() {
  const { user } = useAuth();
  const { trendingNotificationsEnabled } = usePreferences();
  const appState = useRef(AppState.currentState);

  useEffect(() => {
    if (Platform.OS === 'web') return;

    if (!user) {
      void syncTrendingNotificationBackgroundTask(false);
      return;
    }

    void syncTrendingNotificationBackgroundTask(trendingNotificationsEnabled);
  }, [user, trendingNotificationsEnabled]);

  useEffect(() => {
    if (Platform.OS === 'web' || !user || !trendingNotificationsEnabled) return;

    const onAppStateChange = (nextState: AppStateStatus) => {
      if (appState.current === 'active' && nextState.match(/inactive|background/)) {
        void runTrendingNotificationCheck();
      }
      appState.current = nextState;
    };

    const subscription = AppState.addEventListener('change', onAppStateChange);
    return () => subscription.remove();
  }, [user, trendingNotificationsEnabled]);
}
