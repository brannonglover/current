import { LinearGradient } from 'expo-linear-gradient';
import { Platform, StyleSheet, View } from 'react-native';

import {
  FEED_SCROLL_PERSISTENT_GRADIENT_HEIGHT,
  FEED_SCROLL_PERSISTENT_GRADIENT_OPACITY,
} from '@/constants/Layout';
import { useTheme } from '@/hooks/useTheme';

function withAlpha(hex: string, alpha: number) {
  const clamped = Math.min(1, Math.max(0, alpha));
  const alphaHex = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0');
  return `${hex}${alphaHex}`;
}

export function FeedBottomVignette() {
  const { colors } = useTheme();

  const gradientColors = [
    withAlpha(colors.background, 0),
    withAlpha(colors.background, FEED_SCROLL_PERSISTENT_GRADIENT_OPACITY * 0.45),
    withAlpha(colors.background, FEED_SCROLL_PERSISTENT_GRADIENT_OPACITY),
  ] as const;

  return (
    <View
      style={[styles.overlay, Platform.OS === 'android' && styles.overlayAndroid]}
      pointerEvents="none"
      collapsable={false}>
      <LinearGradient
        colors={gradientColors}
        locations={[0, 0.5, 1]}
        style={styles.gradient}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 9,
  },
  overlayAndroid: {
    elevation: 12,
  },
  gradient: {
    width: '100%',
    height: FEED_SCROLL_PERSISTENT_GRADIENT_HEIGHT,
  },
});
