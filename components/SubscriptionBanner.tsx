import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface SubscriptionBannerProps {
  source: string;
}

export function SubscriptionBanner({ source }: SubscriptionBannerProps) {
  const { colors } = useTheme();

  return (
    <View
      style={[
        styles.banner,
        { backgroundColor: colors.border, borderColor: colors.border },
      ]}
      accessibilityRole="text">
      <Ionicons name="information-circle-outline" size={20} color={colors.textSecondary} />
      <View style={styles.textWrap}>
        <Text style={[styles.title, { color: colors.text }]}>Could require subscription</Text>
        <Text style={[styles.body, { color: colors.textSecondary }]}>
          {`Some ${source} articles need a subscription. We'll show whatever we can here.`}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 20,
  },
  textWrap: {
    flex: 1,
    gap: 4,
  },
  title: {
    fontFamily: 'InterSemiBold',
    fontSize: 15,
    lineHeight: 20,
  },
  body: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
  },
});
