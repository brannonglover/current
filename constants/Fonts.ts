import { Inter_400Regular, Inter_500Medium, Inter_600SemiBold } from '@expo-google-fonts/inter';
import { Lora_400Regular, Lora_600SemiBold, Lora_700Bold } from '@expo-google-fonts/lora';
import { useFonts } from 'expo-font';

export function useAppFonts() {
  const [loaded, error] = useFonts({
    Inter: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    Lora: Lora_400Regular,
    LoraSemiBold: Lora_600SemiBold,
    LoraBold: Lora_700Bold,
  });

  return { loaded, error };
}

export const Fonts = {
  body: 'Inter',
  bodyMedium: 'InterMedium',
  bodySemiBold: 'InterSemiBold',
  headline: 'Lora',
  headlineSemiBold: 'LoraSemiBold',
  headlineBold: 'LoraBold',
} as const;
