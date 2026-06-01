import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { tabBarModalBottomOffset } from '@/constants/Layout';
import { usePreferences } from '@/contexts/PreferencesContext';
import { useTheme } from '@/hooks/useTheme';

interface FolderPickerModalProps {
  visible: boolean;
  articleId: string;
  onClose: () => void;
  /** Tab bar height on tab screens (e.g. TAB_BAR_HEIGHT). Sheet anchors flush to its top edge. */
  bottomOffset?: number;
}

export function FolderPickerModal({
  visible,
  articleId,
  onClose,
  bottomOffset = 0,
}: FolderPickerModalProps) {
  const { colors, styles: themeStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    folders,
    createFolder,
    addArticleToFolder,
    removeArticleFromFolder,
    getFoldersForArticle,
  } = usePreferences();

  const [newFolderName, setNewFolderName] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [initialIds, setInitialIds] = useState<Set<string>>(new Set());
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;

    const current = new Set(getFoldersForArticle(articleId).map((f) => f.id));
    setNewFolderName('');
    setSelectedIds(new Set(current));
    setInitialIds(new Set(current));
    setIsSaving(false);
  }, [visible, articleId, getFoldersForArticle, folders]);

  function handleClose() {
    setNewFolderName('');
    onClose();
  }

  function toggleFolderSelection(folderId: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }

  const sheetAnchorBottom =
    bottomOffset > 0 ? tabBarModalBottomOffset(bottomOffset, insets.bottom) : 0;

  const trimmedName = newFolderName.trim();
  const selectionChanged =
    selectedIds.size !== initialIds.size ||
    [...selectedIds].some((id) => !initialIds.has(id));
  const canConfirm = !!trimmedName || selectionChanged;

  async function handleConfirm() {
    if (!canConfirm || isSaving) return;

    setIsSaving(true);
    try {
      if (trimmedName) {
        const folder = await createFolder(trimmedName);
        if (folder) {
          await addArticleToFolder(folder.id, articleId);
        }
      }

      for (const folder of folders) {
        const wasSelected = initialIds.has(folder.id);
        const isSelected = selectedIds.has(folder.id);
        if (isSelected && !wasSelected) {
          await addArticleToFolder(folder.id, articleId);
        } else if (!isSelected && wasSelected) {
          await removeArticleFromFolder(folder.id, articleId);
        }
      }

      handleClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={handleClose}>
      <View style={styles.root}>
        <Pressable style={styles.backdrop} onPress={handleClose} accessibilityRole="button" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={[styles.sheetAnchor, { bottom: sheetAnchorBottom }]}>
          <Pressable
            style={[
              styles.sheet,
              {
                backgroundColor: colors.background,
                borderColor: colors.border,
                paddingBottom: bottomOffset > 0 ? 16 : insets.bottom + 16,
              },
            ]}
            onPress={(e) => e.stopPropagation()}>
            <View style={[styles.handle, { backgroundColor: colors.border }]} />
            <Text style={[styles.title, { color: colors.text }]}>Organize</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Already saved to Liked. Add to folders below or create a new one.
            </Text>

            <ScrollView
              style={styles.body}
              keyboardShouldPersistTaps="handled"
              showsVerticalScrollIndicator={false}>
              <Text style={[themeStyles.label, styles.sectionLabel]} nativeID="new-folder-label">
                New folder
              </Text>
              <TextInput
                style={themeStyles.input}
                value={newFolderName}
                onChangeText={setNewFolderName}
                placeholder="Name a new folder"
                placeholderTextColor={colors.textSecondary}
                accessibilityLabel="New folder name"
                accessibilityLabelledBy="new-folder-label"
                maxLength={40}
                returnKeyType="done"
              />

              <Text style={[themeStyles.label, styles.sectionLabel, styles.existingLabel]}>
                Existing folders
              </Text>

              {folders.length === 0 ? (
                <Text style={[styles.empty, { color: colors.textSecondary }]}>
                  No folders yet — name one above or create folders from the Liked tab.
                </Text>
              ) : (
                <FlatList
                  data={folders}
                  keyExtractor={(item) => item.id}
                  scrollEnabled={false}
                  renderItem={({ item }) => {
                    const selected = selectedIds.has(item.id);
                    return (
                      <Pressable
                        onPress={() => toggleFolderSelection(item.id)}
                        style={({ pressed }) => [
                          styles.row,
                          {
                            borderColor: colors.border,
                            backgroundColor: selected ? colors.accentMuted : 'transparent',
                          },
                          pressed && { opacity: 0.7 },
                        ]}>
                        <Ionicons
                          name={selected ? 'folder' : 'folder-outline'}
                          size={22}
                          color={selected ? colors.accent : colors.textSecondary}
                        />
                        <View style={styles.rowText}>
                          <Text style={[styles.rowLabel, { color: colors.text }]}>{item.name}</Text>
                          <Text style={[styles.rowDetail, { color: colors.textSecondary }]}>
                            {item.articleIds.length}{' '}
                            {item.articleIds.length === 1 ? 'article' : 'articles'}
                          </Text>
                        </View>
                        <Ionicons
                          name={selected ? 'checkmark-circle' : 'ellipse-outline'}
                          size={22}
                          color={selected ? colors.accent : colors.textSecondary}
                        />
                      </Pressable>
                    );
                  }}
                />
              )}
            </ScrollView>

            <View style={styles.actions}>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}>
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Done</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleConfirm()}
                disabled={!canConfirm || isSaving}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.text },
                  (!canConfirm || isSaving) && { opacity: 0.5 },
                  pressed && canConfirm && !isSaving && { opacity: 0.85 },
                ]}>
                <Text style={[styles.primaryButtonText, { color: colors.background }]}>
                  {isSaving ? 'Saving…' : 'Confirm'}
                </Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  sheetAnchor: {
    position: 'absolute',
    left: 0,
    right: 0,
  },
  sheet: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    borderWidth: StyleSheet.hairlineWidth,
    paddingHorizontal: 24,
    paddingTop: 12,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    marginBottom: 16,
  },
  title: {
    fontFamily: 'LoraBold',
    fontSize: 22,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    marginTop: 4,
    marginBottom: 16,
  },
  body: {
    maxHeight: 360,
  },
  sectionLabel: {
    marginBottom: 8,
  },
  existingLabel: {
    marginTop: 20,
  },
  empty: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: StyleSheet.hairlineWidth,
    marginBottom: 8,
  },
  rowText: {
    flex: 1,
    minWidth: 0,
  },
  rowLabel: {
    fontFamily: 'InterSemiBold',
    fontSize: 16,
  },
  rowDetail: {
    fontFamily: 'Inter',
    fontSize: 13,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
  },
  secondaryButton: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  secondaryButtonText: {
    fontFamily: 'InterSemiBold',
    fontSize: 15,
  },
  primaryButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  primaryButtonText: {
    fontFamily: 'InterSemiBold',
    fontSize: 15,
  },
});
