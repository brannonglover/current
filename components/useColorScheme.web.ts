import { useContext } from 'react';
import { useColorScheme as useSystemColorScheme } from 'react-native';

import { ThemeContext } from '@/contexts/ThemeContext';

export function useColorScheme(): 'light' | 'dark' {
  const ctx = useContext(ThemeContext);
  if (ctx) return ctx.colorScheme;

  const systemScheme = useSystemColorScheme();
  return systemScheme === 'dark' ? 'dark' : 'light';
}
