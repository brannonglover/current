import { Image, ImageStyle } from 'expo-image';
import { StyleProp, StyleSheet, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface ArticleImageProps {
  uri: string;
  style?: StyleProp<ImageStyle>;
}

export function ArticleImage({ uri, style }: ArticleImageProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.wrap, style, { backgroundColor: colors.surface }]}>
      <Image
        source={{ uri }}
        style={StyleSheet.absoluteFill}
        contentFit="cover"
        transition={200}
        cachePolicy="memory-disk"
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    overflow: 'hidden',
  },
});
