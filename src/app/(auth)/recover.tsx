import { useRouter } from 'expo-router';
import { KeyRound, LockKeyhole, Mail, Share2 } from 'lucide-react-native';
import React, { useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/stores/authStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function RecoverScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const resetPassword = useAuthStore((state) => state.resetPassword);
  const busy = useAuthStore((state) => state.busy);
  const error = useAuthStore((state) => state.error);
  const clearError = useAuthStore((state) => state.clearError);
  const recoveryKey = useAuthStore((state) => state.recoveryKey);

  const [email, setEmail] = useState('');
  const [key, setKey] = useState('');
  const [password, setPassword] = useState('');
  const [done, setDone] = useState(false);

  const submit = async () => {
    clearError();
    const ok = await resetPassword({ email, recoveryKey: key, password });
    if (ok) setDone(true);
  };

  const finish = () => {
    const onboarded = useAuthStore.getState().onboarded;
    router.replace(onboarded ? '/(tabs)' : '/(auth)/onboarding');
  };

  if (done) {
    return (
      <Screen>
        <PageHeader onBack={finish} />
        <View style={styles.header}>
          <View style={[styles.iconWrap, { backgroundColor: colors.accentSoft }]}>
            <KeyRound size={24} color={colors.accent} />
          </View>
          <Text variant="display">You’re back in</Text>
          <Text variant="body" tone="secondary">
            Your password has been changed. Save this new recovery key — the old
            one no longer works.
          </Text>
        </View>
        <View style={[styles.keyCard, { backgroundColor: colors.surfaceSolid, borderColor: colors.borderStrong }]}>
          <Text variant="eyebrow" tone="tertiary">
            NEW RECOVERY KEY
          </Text>
          <Text variant="heading" selectable style={styles.keyText}>
            {recoveryKey}
          </Text>
        </View>
        <View style={styles.actions}>
          <Button
            label="Share key"
            icon={Share2}
            variant="secondary"
            onPress={() =>
              recoveryKey
                ? void Share.share({ message: `BOUND recovery key: ${recoveryKey}` })
                : undefined
            }
            fullWidth
          />
          <Button label="Continue" onPress={finish} fullWidth />
        </View>
      </Screen>
    );
  }

  return (
    <Screen
      footer={
        <View style={[styles.footer, { borderTopColor: colors.border }]}>
          <Button
            label="Reset password"
            onPress={submit}
            loading={busy}
            disabled={!email.trim() || !key.trim() || !password}
            fullWidth
            size="lg"
          />
        </View>
      }>
      <PageHeader />
      <View style={styles.header}>
        <Text variant="display">Recover access</Text>
        <Text variant="body" tone="secondary">
          Use the recovery key you saved when you created your account.
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
          keyboardType="email-address"
          autoComplete="email"
        />
        <TextField
          label="RECOVERY KEY"
          placeholder="BND-XXXX-XXXX-XXXX"
          value={key}
          onChangeText={(value) => setKey(value.toUpperCase())}
          icon={KeyRound}
          autoCapitalize="characters"
          autoCorrect={false}
        />
        <TextField
          label="NEW PASSWORD"
          placeholder="At least 8 characters"
          value={password}
          onChangeText={setPassword}
          icon={LockKeyhole}
          secure
          autoComplete="new-password"
        />
        {error ? (
          <Text variant="small" tone="danger">
            {error}
          </Text>
        ) : null}
        <Text variant="caption" tone="tertiary">
          Recovery keys look like BND-4F2A-9C13-77DE and were shown once at sign
          up. BOUND stores only a hash of your key.
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  header: {
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
    gap: spacing.sm,
  },
  iconWrap: {
    width: 48,
    height: 48,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: spacing.xs,
  },
  form: {
    gap: spacing.md,
  },
  keyCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.xl,
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  keyText: {
    letterSpacing: 1.2,
  },
  actions: {
    gap: spacing.sm,
  },
  footer: {
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
});
