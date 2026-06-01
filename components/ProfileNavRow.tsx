import { Ionicons } from '@expo/vector-icons';
import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface ProfileNavRowProps {
  href: '/sources';
  icon: keyof typeof Ionicons.glyphMap;
  label: string;
  detail?: string;
}

export function ProfileNavRow({ href, icon, label, detail }: ProfileNavRowProps) {
  const { colors } = useTheme();

  return (
    <Link href={href} asChild>
      <Pressable
        style={[
          styles.card,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}>
        <View style={styles.row}>
          <Ionicons name={icon} size={20} color={colors.textSecondary} style={styles.leadingIcon} />
          <View style={styles.textWrap}>
            <Text style={[styles.label, { color: colors.text }]}>{label}</Text>
            {detail ? (
              <Text style={[styles.detail, { color: colors.textSecondary }]}>{detail}</Text>
            ) : null}
          </View>
          <Ionicons
            name="chevron-forward"
            size={16}
            color={colors.textSecondary}
            style={styles.chevron}
          />
        </View>
      </Pressable>
    </Link>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '100%',
    paddingVertical: 18,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  leadingIcon: {
    marginRight: 14,
    flexShrink: 0,
  },
  textWrap: {
    flex: 1,
    minWidth: 0,
    gap: 4,
    marginRight: 8,
  },
  chevron: {
    marginLeft: 'auto',
    flexShrink: 0,
  },
  label: {
    fontFamily: 'InterSemiBold',
    fontSize: 16,
  },
  detail: {
    fontFamily: 'Inter',
    fontSize: 13,
    lineHeight: 18,
  },
});
