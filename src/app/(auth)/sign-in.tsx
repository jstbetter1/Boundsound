import { useRouter } from 'expo-router';
import { ArrowRight, LockKeyhole, Mail } from 'lucide-react-native';
import React, { useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { spacing } from '@/theme/tokens';

export default function SignInScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const signIn = useAuthStore((state) => state.signIn);
  const busy = useAuthStore((state) => state.busy);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const submit = async () => {
    clearError();
    const ok = await signIn(email, password);
    if (!ok) return;
    const onboarded = useAuthStore.getState().onboarded;
    router.replace(onboarded ? '/(tabs)' : '/(auth)/onboarding');
  };

  return (
    <Screen
      footer={
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            label="Sign in"
            onPress={submit}
            loading={busy}
            disabled={!email.trim() || !password}
            fullWidth
            size="lg"
          />
        </View>
      }>
      <PageHeader />
      <View style={styles.header}>
        <Text variant="display">Welcome back</Text>
        <Text variant="body" tone="secondary">
          Sign in to pick up your library exactly where you left it.
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="EMAIL"
          placeholder="you@example.com"
          value={email}
          onChangeText={setEmail}
          icon={Mail}
          autoCapitalize="none"
          autoComplete="email"
          keyboardType="email-address"
          textContentType="emailAddress"
          returnKeyType="next"
        />
        <TextField
          label="PASSWORD"
          placeholder="Your password"
          value={password}
          onChangeText={setPassword}
          icon={LockKeyhole}
          secure
          autoComplete="current-password"
          textContentType="password"
          returnKeyType="go"
          onSubmitEditing={submit}
        />
        {error ? (
          <Text variant="small" tone="danger">
            {error}
          </Text>
        ) : null}
        <Pressable
          onPress={() => router.push('/(auth)/recover')}
          hitSlop={8}
          accessibilityRole="button"
          style={styles.forgot}>
          <Text variant="small" style={{ color: colors.textSecondary }}>
            Forgot your password?
          </Text>
        </Pressable>
      </View>

      <Pressable
        onPress={() => router.replace('/(auth)/create-account')}
        style={styles.switch}
        accessibilityRole="button">
        <Text variant="small" tone="tertiary">
          New to BOUND?{' '}
        </Text>
        <Text variant="small" style={{ color: colors.accent }}>
          Create an account{' '}
        </Text>
        <ArrowRight size={13} color={colors.accent} />
      </Pressable>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  form: {
    gap: spacing.md,
  },
  forgot: {
    alignSelf: 'flex-end',
    paddingVertical: 2,
  },
  switch: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
