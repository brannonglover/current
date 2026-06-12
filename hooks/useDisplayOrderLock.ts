import { useCallback, useEffect, useRef } from 'react';

import { isFilterExpansion } from '@/utils/mergeDisplayFeed';

/**
 * Keeps feed tab display order stable until the user explicitly refreshes
 * (pull-to-refresh or apply-pending banner). Filter narrowing still rebuilds.
 */
export function useDisplayOrderLock(isRefreshing: boolean) {
  const lockedRef = useRef(false);
  const userRebuildRef = useRef(false);

  useEffect(() => {
    if (isRefreshing) userRebuildRef.current = true;
  }, [isRefreshing]);

  const markInitialDisplay = useCallback(() => {
    lockedRef.current = true;
  }, []);

  const shouldAllowFullRebuild = useCallback(
    (filtersChanged: boolean, prevFilterKey: string, filterKey: string) => {
      if (userRebuildRef.current) {
        userRebuildRef.current = false;
        lockedRef.current = true;
        return true;
      }
      if (filtersChanged && !isFilterExpansion(prevFilterKey, filterKey)) return true;
      return !lockedRef.current;
    },
    [],
  );

  const shouldAllowSilentMerge = useCallback(() => {
    if (userRebuildRef.current) return true;
    return !lockedRef.current;
  }, []);

  return { markInitialDisplay, shouldAllowFullRebuild, shouldAllowSilentMerge };
}
