import { Link } from 'expo-router';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useTheme } from '@/hooks/useTheme';

interface AuthFormProps {
  mode: 'login' | 'register';
  onSubmit: (data: { name?: string; email: string; password: string }) => Promise<void>;
}

export function AuthForm({ mode, onSubmit }: AuthFormProps) {
  const { colors, styles: themeStyles } = useTheme();
  const insets = useSafeAreaInsets();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit() {
    setError(null);
    if (mode === 'register' && !name.trim()) {
      setError('Please enter your name.');
      return;
    }
    if (!email.trim() || !password) {
      setError('Please enter your email and password.');
      return;
    }
    if (password.length < 6) {
      setError('Password must be at least 6 characters.');
      return;
    }

    setLoading(true);
    try {
      await onSubmit({ name: name.trim(), email: email.trim(), password });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={[styles.flex, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={[
          styles.container,
          { paddingTop: insets.top + 24, paddingBottom: insets.bottom + 24 },
        ]}
        keyboardShouldPersistTaps="handled">
        <Text style={themeStyles.title}>
          {mode === 'register' ? 'Create account' : 'Welcome back'}
        </Text>
        <Text style={[themeStyles.body, styles.subtitle, { color: colors.textSecondary }]}>
          {mode === 'register'
            ? 'Sign up so we can learn what you love to read.'
            : 'Sign in to pick up where you left off.'}
        </Text>

        {mode === 'register' && (
          <View style={styles.field}>
            <Text style={themeStyles.label}>Name</Text>
            <TextInput
              style={themeStyles.input}
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              placeholderTextColor={colors.textSecondary}
              autoCapitalize="words"
              autoComplete="name"
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={themeStyles.label}>Email</Text>
          <TextInput
            style={themeStyles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="you@example.com"
            placeholderTextColor={colors.textSecondary}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
        </View>

        <View style={styles.field}>
          <Text style={themeStyles.label}>Password</Text>
          <TextInput
            style={themeStyles.input}
            value={password}
            onChangeText={setPassword}
            placeholder="At least 6 characters"
            placeholderTextColor={colors.textSecondary}
            secureTextEntry
            autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
          />
        </View>

        {error && <Text style={[styles.error, { color: colors.accent }]}>{error}</Text>}

        <Pressable
          style={[themeStyles.button, loading && styles.disabled]}
          onPress={handleSubmit}
          disabled={loading}>
          {loading ? (
            <ActivityIndicator color={colors.background} />
          ) : (
            <Text style={themeStyles.buttonText}>
              {mode === 'register' ? 'Create account' : 'Sign in'}
            </Text>
          )}
        </Pressable>

        <Link href={mode === 'register' ? '/login' : '/register'} asChild>
          <Pressable style={styles.switchLink}>
            <Text style={[themeStyles.caption, { color: colors.textSecondary }]}>
              {mode === 'register' ? 'Already have an account? ' : "Don't have an account? "}
              <Text style={{ color: colors.accent, fontFamily: 'InterSemiBold' }}>
                {mode === 'register' ? 'Sign in' : 'Sign up'}
              </Text>
            </Text>
          </Pressable>
        </Link>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1 },
  container: {
    flexGrow: 1,
    paddingHorizontal: 24,
  },
  subtitle: {
    marginTop: 8,
    marginBottom: 32,
  },
  field: {
    marginBottom: 20,
    gap: 8,
  },
  error: {
    fontFamily: 'InterMedium',
    fontSize: 14,
    marginBottom: 16,
  },
  disabled: {
    opacity: 0.7,
  },
  switchLink: {
    marginTop: 24,
    alignItems: 'center',
  },
});
