import { Image } from 'expo-image';
import { useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface SourceLogoProps {
  uri?: string;
  name: string;
}

export function SourceLogo({ uri, name }: SourceLogoProps) {
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const showFallback = !uri || failed;
  const initial = name.trim().charAt(0).toUpperCase() || '?';

  return (
    <View
      style={[
        styles.wrap,
        { backgroundColor: colors.border, borderColor: colors.border },
      ]}>
      {showFallback ? (
        <Text style={[styles.initial, { color: colors.textSecondary }]}>{initial}</Text>
      ) : (
        <Image
          source={{ uri }}
          style={styles.image}
          contentFit="contain"
          transition={150}
          cachePolicy="memory-disk"
          onError={() => setFailed(true)}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  image: {
    width: 24,
    height: 24,
  },
  initial: {
    fontFamily: 'InterSemiBold',
    fontSize: 14,
  },
});
