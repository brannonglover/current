import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { useTheme } from '@/hooks/useTheme';

interface CreateFolderModalProps {
  visible: boolean;
  onClose: () => void;
  onCreate: (name: string) => Promise<void>;
  title?: string;
}

export function CreateFolderModal({
  visible,
  onClose,
  onCreate,
  title = 'New folder',
}: CreateFolderModalProps) {
  const { colors, styles: themeStyles } = useTheme();
  const [name, setName] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  function handleClose() {
    setName('');
    onClose();
  }

  async function handleCreate() {
    const trimmed = name.trim();
    if (!trimmed || isSaving) return;

    setIsSaving(true);
    try {
      await onCreate(trimmed);
      setName('');
      onClose();
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
      <Pressable style={styles.backdrop} onPress={handleClose}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : undefined}
          style={styles.centered}>
          <Pressable
            style={[styles.sheet, { backgroundColor: colors.surface, borderColor: colors.border }]}
            onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.title, { color: colors.text }]}>{title}</Text>
            <Text style={[themeStyles.label, styles.label]} nativeID="folder-name-label">
              Folder name
            </Text>
            <TextInput
              style={themeStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Weekend reads"
              placeholderTextColor={colors.textSecondary}
              accessibilityLabel="Folder name"
              accessibilityLabelledBy="folder-name-label"
              autoFocus
              maxLength={40}
              onSubmitEditing={() => void handleCreate()}
            />
            <View style={styles.actions}>
              <Pressable
                onPress={handleClose}
                style={({ pressed }) => [
                  styles.secondaryButton,
                  { borderColor: colors.border },
                  pressed && { opacity: 0.7 },
                ]}>
                <Text style={[styles.secondaryButtonText, { color: colors.text }]}>Cancel</Text>
              </Pressable>
              <Pressable
                onPress={() => void handleCreate()}
                disabled={!name.trim() || isSaving}
                style={({ pressed }) => [
                  styles.primaryButton,
                  { backgroundColor: colors.text },
                  (!name.trim() || isSaving) && { opacity: 0.5 },
                  pressed && name.trim() && !isSaving && { opacity: 0.85 },
                ]}>
                <Text style={[styles.primaryButtonText, { color: colors.background }]}>Create</Text>
              </Pressable>
            </View>
          </Pressable>
        </KeyboardAvoidingView>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    paddingHorizontal: 24,
  },
  centered: {
    width: '100%',
  },
  sheet: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
  },
  title: {
    fontFamily: 'LoraBold',
    fontSize: 22,
    marginBottom: 16,
  },
  label: {
    marginBottom: 8,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 20,
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
