import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';
import { LikedFolder } from '@/types';

interface LikedFoldersBarProps {
  folders: LikedFolder[];
  selectedFolderId: string | null;
  allCount: number;
  onSelectFolder: (folderId: string | null) => void;
  onCreateFolder: () => void;
}

export function LikedFoldersBar({
  folders,
  selectedFolderId,
  allCount,
  onSelectFolder,
  onCreateFolder,
}: LikedFoldersBarProps) {
  const { colors } = useTheme();

  return (
    <View style={[styles.container, { borderBottomColor: colors.border }]}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}>
        <Pressable
          onPress={() => onSelectFolder(null)}
          style={({ pressed }) => [
            styles.chip,
            {
              backgroundColor: selectedFolderId === null ? colors.accentMuted : colors.surface,
              borderColor: selectedFolderId === null ? colors.accent : colors.border,
            },
            pressed && { opacity: 0.7 },
          ]}>
          <Ionicons
            name="heart"
            size={14}
            color={selectedFolderId === null ? colors.accent : colors.textSecondary}
          />
          <Text
            style={[
              styles.chipText,
              { color: selectedFolderId === null ? colors.accent : colors.text },
            ]}>
            All ({allCount})
          </Text>
        </Pressable>

        {folders.map((folder) => {
          const selected = selectedFolderId === folder.id;
          return (
            <Pressable
              key={folder.id}
              onPress={() => onSelectFolder(folder.id)}
              style={({ pressed }) => [
                styles.chip,
                {
                  backgroundColor: selected ? colors.accentMuted : colors.surface,
                  borderColor: selected ? colors.accent : colors.border,
                },
                pressed && { opacity: 0.7 },
              ]}>
              <Ionicons
                name={selected ? 'folder' : 'folder-outline'}
                size={14}
                color={selected ? colors.accent : colors.textSecondary}
              />
              <Text
                style={[styles.chipText, { color: selected ? colors.accent : colors.text }]}
                numberOfLines={1}>
                {folder.name} ({folder.articleIds.length})
              </Text>
            </Pressable>
          );
        })}

        <Pressable
          onPress={onCreateFolder}
          style={({ pressed }) => [
            styles.chip,
            styles.newChip,
            { borderColor: colors.border, backgroundColor: colors.surface },
            pressed && { opacity: 0.7 },
          ]}>
          <Ionicons name="add" size={16} color={colors.textSecondary} />
          <Text style={[styles.chipText, { color: colors.textSecondary }]}>New folder</Text>
        </Pressable>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    paddingTop: 12,
    paddingBottom: 12,
  },
  scrollContent: {
    paddingHorizontal: 24,
    gap: 8,
    flexDirection: 'row',
    alignItems: 'center',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
    maxWidth: 180,
  },
  newChip: {
    borderStyle: 'dashed',
  },
  chipText: {
    fontFamily: 'InterMedium',
    fontSize: 13,
    flexShrink: 1,
  },
});
