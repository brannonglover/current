import { useMemo } from 'react';
import { StyleSheet } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

export function useTheme() {
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  const styles = useMemo(
    () =>
      StyleSheet.create({
        screen: {
          flex: 1,
          backgroundColor: colors.background,
        },
        surface: {
          backgroundColor: colors.surface,
          borderColor: colors.border,
        },
        title: {
          fontFamily: 'LoraBold',
          fontSize: 28,
          color: colors.text,
          letterSpacing: -0.5,
        },
        headline: {
          fontFamily: 'LoraSemiBold',
          fontSize: 22,
          color: colors.text,
          lineHeight: 30,
        },
        body: {
          fontFamily: 'Inter',
          fontSize: 16,
          color: colors.text,
          lineHeight: 24,
        },
        caption: {
          fontFamily: 'Inter',
          fontSize: 13,
          color: colors.textSecondary,
        },
        label: {
          fontFamily: 'InterMedium',
          fontSize: 12,
          color: colors.textSecondary,
          textTransform: 'uppercase',
          letterSpacing: 1,
        },
        input: {
          fontFamily: 'Inter',
          fontSize: 16,
          color: colors.text,
          backgroundColor: colors.surface,
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingHorizontal: 16,
          paddingVertical: 14,
        },
        button: {
          backgroundColor: colors.text,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
        },
        buttonText: {
          fontFamily: 'InterSemiBold',
          fontSize: 16,
          color: colors.background,
        },
        buttonSecondary: {
          backgroundColor: 'transparent',
          borderWidth: 1,
          borderColor: colors.border,
          borderRadius: 12,
          paddingVertical: 16,
          alignItems: 'center',
        },
        buttonSecondaryText: {
          fontFamily: 'InterSemiBold',
          fontSize: 16,
          color: colors.text,
        },
      }),
    [colors],
  );

  return { colors, scheme, styles };
}
