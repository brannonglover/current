import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export type WorldCupTab = 'bracket' | 'scores' | 'news';

const TABS: { id: WorldCupTab; label: string }[] = [
  { id: 'bracket', label: 'Bracket' },
  { id: 'scores', label: 'Scores' },
  { id: 'news', label: 'Latest News' },
];

interface WorldCupTabBarProps {
  activeTab: WorldCupTab;
  onSelectTab: (tab: WorldCupTab) => void;
}

export function WorldCupTabBar({ activeTab, onSelectTab }: WorldCupTabBarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <View style={styles.row}>
        {TABS.map((tab) => {
          const selected = activeTab === tab.id;
          return (
            <Pressable
              key={tab.id}
              onPress={() => onSelectTab(tab.id)}
              accessibilityRole="tab"
              accessibilityState={{ selected }}
              accessibilityLabel={tab.label}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? colors.accentMuted : colors.surface,
                  borderColor: selected ? colors.accent : colors.border,
                },
                pressed && { opacity: 0.7 },
              ]}>
              <Text
                style={[styles.chipText, { color: selected ? colors.accent : colors.text }]}
                numberOfLines={1}>
                {tab.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipText: {
    fontFamily: 'InterMedium',
    fontSize: 13,
  },
});
