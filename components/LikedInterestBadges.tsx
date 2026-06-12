import { LinearGradient } from 'expo-linear-gradient';
import { ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { LikedInterestBadgeItem } from '@/services/recommendations';

interface LikedInterestBadgesProps {
  items: LikedInterestBadgeItem[];
}

export function LikedInterestBadges({ items }: LikedInterestBadgesProps) {
  const { colors } = useTheme();

  if (items.length === 0) return null;

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <Text style={[styles.label, { color: colors.textSecondary }]}>Based on your likes</Text>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        {items.map((item) => {
          const isKeyword = item.kind === 'keyword';
          return (
            <View
              key={`${item.kind}-${item.key}`}
              style={[
                styles.chip,
                {
                  backgroundColor: isKeyword ? colors.surface : colors.accentMuted,
                  borderColor: isKeyword ? colors.border : colors.accentMuted,
                },
              ]}>
              <Text
                style={[styles.chipText, { color: isKeyword ? colors.text : colors.accent }]}
                numberOfLines={1}>
                {item.label}
              </Text>
            </View>
          );
        })}
      </ScrollView>
      <LinearGradient
        pointerEvents="none"
        colors={[`${colors.background}00`, colors.background]}
        start={{ x: 0, y: 0.5 }}
        end={{ x: 1, y: 0.5 }}
        style={styles.scrollFade}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 4,
    paddingBottom: 12,
    position: 'relative',
  },
  label: {
    fontFamily: 'Inter',
    fontSize: 13,
    paddingHorizontal: 24,
    marginBottom: 8,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: 'InterMedium',
    fontSize: 13,
  },
  scrollFade: {
    position: 'absolute',
    right: 0,
    bottom: 12,
    top: 28,
    width: 28,
  },
});
