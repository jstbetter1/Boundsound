import { useRouter } from 'expo-router';
import { LockKeyhole, Mail, User } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { passwordStrength } from '@/services/auth';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Strong', 'Excellent'];

export default function CreateAccountScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const signUp = useAuthStore((state) => state.signUp);
  const busy = useAuthStore((state) => state.busy);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');

  const strength = useMemo(() => passwordStrength(password), [password]);
  const mismatch = confirm.length > 0 && confirm !== password;

  const submit = async () => {
    clearError();
    if (mismatch) return;
    const ok = await signUp({ email, password, displayName });
    if (ok) router.replace('/(auth)/onboarding');
  };

  return (
    <Screen
      footer={
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            label="Create account"
            onPress={submit}
            loading={busy}
            disabled={!displayName.trim() || !email.trim() || !password || mismatch}
            fullWidth
            size="lg"
          />
        </View>
      }>
      <PageHeader />
      <View style={styles.header}>
        <Text variant="display">Make it yours</Text>
        <Text variant="body" tone="secondary">
          A name, an email, and a password. We’ll generate a recovery key so you
          never lose your library.
        </Text>
      </View>

      <View style={styles.form}>
        <TextField
          label="DISPLAY NAME"
          placeholder="What should we call you?"
          value={displayName}
          onChangeText={setDisplayName}
          icon={User}
          autoCapitalize="words"
          autoComplete="name"
          returnKeyType="next"
          maxLength={32}
        />
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
          placeholder="At least 8 characters"
          value={password}
          onChangeText={setPassword}
          icon={LockKeyhole}
          secure
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="next"
        />
        {password ? (
          <View style={styles.strength}>
            <View style={styles.bars}>
              {[1, 2, 3, 4].map((step) => (
                <View
                  key={step}
                  style={[
                    styles.bar,
                    {
                      backgroundColor:
                        step <= strength
                          ? strength < 2
                            ? colors.danger
                            : strength < 3
                              ? colors.warning
                              : colors.success
                          : colors.surfaceSunken,
                    },
                  ]}
                />
              ))}
            </View>
            <Text variant="caption" tone="tertiary">
              {STRENGTH_LABELS[strength]}
            </Text>
          </View>
        ) : null}
        <TextField
          label="CONFIRM PASSWORD"
          placeholder="Type it again"
          value={confirm}
          onChangeText={setConfirm}
          icon={LockKeyhole}
          secure
          autoComplete="new-password"
          textContentType="newPassword"
          returnKeyType="go"
          error={mismatch ? 'Passwords do not match.' : undefined}
          onSubmitEditing={submit}
        />
        {error ? (
          <Text variant="small" tone="danger">
            {error}
          </Text>
        ) : null}
      </View>

      <Pressable
        onPress={() => router.replace('/(auth)/sign-in')}
        style={styles.switch}
        accessibilityRole="button">
        <Text variant="small" tone="tertiary">
          Already have an account?{' '}
        </Text>
        <Text variant="small" style={{ color: colors.accent }}>
          Sign in
        </Text>
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
  strength: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  bars: {
    flex: 1,
    flexDirection: 'row',
    gap: 4,
  },
  bar: {
    flex: 1,
    height: 4,
    borderRadius: radius.pill,
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
