import Constants from 'expo-constants';
import { useRouter } from 'expo-router';
import {
  Activity,
  AudioLines,
  AudioWaveform,
  Database,
  Download,
  Eye,
  Gauge,
  History,
  Info,
  LogOut,
  MonitorSmartphone,
  Moon,
  Radio,
  SlidersHorizontal,
  Sparkles,
  UserRound,
} from 'lucide-react-native';
import React from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { ListRow, RowDivider, RowGroup, SectionLabel, SwitchRow } from '@/components/ui/ListRow';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { Text } from '@/components/ui/Text';
import { DEMO_AUDIO_CREDIT } from '@/data/catalog';
import { formatBytes } from '@/lib/format';
import { AUDIUS_CREDIT } from '@/services/audius';
import { useAuthStore } from '@/stores/authStore';
import { useDownloadsStore } from '@/stores/downloadsStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import type { ThemePreference } from '@/theme/ThemeProvider';

export default function SettingsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const account = useAuthStore((state) => state.account);
  const signOut = useAuthStore((state) => state.signOut);
  const preferences = usePreferencesStore((state) => state.preferences);
  const setPreference = usePreferencesStore((state) => state.setPreference);
  const records = useDownloadsStore((state) => state.records);

  const completed = Object.values(records).filter((record) => record.status === 'completed');
  const storageUsed = completed.reduce((sum, record) => sum + (record.bytes ?? 0), 0);
  const version = Constants.expoConfig?.version ?? '1.0.0';

  const confirmSignOut = () => {
    Alert.alert('Sign out?', 'Your library stays saved on this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: () => {
          void signOut().then(() => router.replace('/'));
        },
      },
    ]);
  };

  return (
    <Screen>
      <PageHeader title="Settings" />

      <View style={styles.section}>
        <SectionLabel>ACCOUNT</SectionLabel>
        <RowGroup>
          <ListRow
            icon={UserRound}
            title={account?.displayName ?? 'Listener'}
            subtitle={
              account?.kind === 'guest' ? 'Guest · tap to upgrade' : (account?.email ?? undefined)
            }
            onPress={() => router.push('/profile')}
          />
        </RowGroup>
      </View>

      <View style={styles.section}>
        <SectionLabel>APPEARANCE</SectionLabel>
        <View style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.groupHeader}>
            <Moon size={17} color={colors.textSecondary} strokeWidth={1.9} />
            <Text variant="bodySemibold">Theme</Text>
          </View>
          <SegmentedControl<ThemePreference>
            value={preferences.theme}
            onChange={(value) => setPreference('theme', value)}
            options={[
              { value: 'dark', label: 'Dark' },
              { value: 'light', label: 'Light' },
              { value: 'system', label: 'System' },
            ]}
          />
        </View>
        <RowGroup>
          <SwitchRow
            icon={Activity}
            title="Reduce motion"
            subtitle="Limit animations and transitions"
            value={preferences.reduceMotion}
            onValueChange={(value) => setPreference('reduceMotion', value)}
          />
        </RowGroup>
      </View>

      <View style={styles.section}>
        <SectionLabel>PLAYBACK</SectionLabel>
        <RowGroup>
          <SwitchRow
            icon={Radio}
            title="Autoplay similar"
            subtitle="Keep the music going when the queue ends"
            value={preferences.autoplaySimilar}
            onValueChange={(value) => setPreference('autoplaySimilar', value)}
          />
          <RowDivider />
          <SwitchRow
            icon={MonitorSmartphone}
            title="Background playback"
            subtitle="Keep playing when the app is not focused"
            value={preferences.backgroundPlayback}
            onValueChange={(value) => setPreference('backgroundPlayback', value)}
          />
          <RowDivider />
          <SwitchRow
            icon={SlidersHorizontal}
            title="Lock screen controls"
            subtitle="Show playback controls on the lock screen"
            value={preferences.lockScreenControls}
            onValueChange={(value) => setPreference('lockScreenControls', value)}
          />
          <RowDivider />
          <SwitchRow
            icon={Eye}
            title="Show explicit content"
            subtitle="Include explicit tracks in mixes and radio"
            value={preferences.showExplicit}
            onValueChange={(value) => setPreference('showExplicit', value)}
          />
        </RowGroup>

        <View
          style={[styles.group, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.groupHeader}>
            <Gauge size={17} color={colors.textSecondary} strokeWidth={1.9} />
            <Text variant="bodySemibold">Streaming quality</Text>
          </View>
          <SegmentedControl
            value={preferences.audioQuality}
            onChange={(value) => setPreference('audioQuality', value)}
            options={[
              { value: 'standard', label: 'Standard' },
              { value: 'high', label: 'High' },
            ]}
          />
          <Text variant="caption" tone="tertiary">
            High uses more data. Downloads always fetch the best available file.
          </Text>
        </View>
      </View>

      <View style={styles.section}>
        <SectionLabel>LIBRARY & DATA</SectionLabel>
        <RowGroup>
          <ListRow
            icon={History}
            title="Listening history"
            onPress={() => router.push('/settings/history')}
          />
          <RowDivider />
          <ListRow
            icon={Sparkles}
            title="Taste profile"
            subtitle="Genres and artists that shape your mixes"
            onPress={() => router.push('/settings/taste')}
          />
          <RowDivider />
          <ListRow
            icon={Database}
            title="Offline storage"
            value={formatBytes(storageUsed)}
            onPress={() => router.push('/(tabs)/downloads')}
          />
        </RowGroup>
      </View>

      <View style={styles.section}>
        <SectionLabel>DOWNLOADS</SectionLabel>
        <RowGroup>
          <ListRow
            icon={Download}
            title="Downloaded music"
            subtitle={`${completed.length} track${completed.length === 1 ? '' : 's'} available offline`}
            onPress={() => router.push('/(tabs)/downloads')}
          />
          <RowDivider />
          <SwitchRow
            icon={AudioLines}
            title="Download over cellular"
            subtitle="Allow downloads on mobile data"
            value={preferences.downloadOverCellular}
            onValueChange={(value) => setPreference('downloadOverCellular', value)}
          />
        </RowGroup>
      </View>

      <View style={styles.section}>
        <SectionLabel>TOOLS</SectionLabel>
        <RowGroup>
          <ListRow
            icon={AudioWaveform}
            title="Audio converter"
            subtitle="Turn your own audio files into WAV"
            onPress={() => router.push('/settings/converter')}
          />
        </RowGroup>
      </View>

      <View style={styles.section}>
        <SectionLabel>ABOUT</SectionLabel>
        <RowGroup>
          <ListRow icon={Info} title="Version" value={version} showChevron={false} />
          <RowDivider />
          <ListRow
            title="Demo audio"
            subtitle={DEMO_AUDIO_CREDIT}
            showChevron={false}
          />
          <RowDivider />
          <ListRow
            title="Independent catalog"
            subtitle={AUDIUS_CREDIT}
            showChevron={false}
          />
          <RowDivider />
          <ListRow
            icon={LogOut}
            title="Sign out"
            destructive
            showChevron={false}
            onPress={confirmSignOut}
          />
        </RowGroup>
        <Text variant="caption" tone="tertiary" center style={styles.footer}>
          BOUND · music, unbound
        </Text>
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  section: {
    gap: spacing.sm,
    marginBottom: spacing.xl,
  },
  group: {
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    padding: spacing.md,
    gap: spacing.md,
  },
  groupHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footer: {
    marginTop: spacing.md,
  },
});
