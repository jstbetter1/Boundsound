import { useRouter } from 'expo-router';
import {
  ArrowDownToLine,
  Check,
  RefreshCw,
  Trash2,
  X,
} from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Alert, Platform, Pressable, StyleSheet, View } from 'react-native';

import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { getTrackById } from '@/data/catalog';
import { formatBytes } from '@/lib/format';
import { useDownloadsStore } from '@/stores/downloadsStore';
import { usePlayerStore } from '@/stores/playerStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';
import type { DownloadRecord } from '@/types';

const STATUS_LABEL: Record<DownloadRecord['status'], string> = {
  queued: 'Queued',
  downloading: 'Downloading',
  completed: 'Downloaded',
  failed: 'Failed',
  paused: 'Paused',
};

export default function DownloadsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const records = useDownloadsStore((state) => state.records);
  const retry = useDownloadsStore((state) => state.retry);
  const remove = useDownloadsStore((state) => state.remove);
  const cancel = useDownloadsStore((state) => state.cancel);
  const clearAll = useDownloadsStore((state) => state.clearAll);
  const playTrack = usePlayerStore((state) => state.playTrack);

  const list = useMemo(
    () =>
      Object.values(records)
        .map((record) => ({ record, track: getTrackById(record.trackId) }))
        .filter((item): item is { record: DownloadRecord; track: NonNullable<ReturnType<typeof getTrackById>> } =>
          Boolean(item.track),
        )
        .sort((a, b) => b.record.updatedAt - a.record.updatedAt),
    [records],
  );

  const completed = list.filter((item) => item.record.status === 'completed');
  const active = list.filter(
    (item) => item.record.status === 'downloading' || item.record.status === 'queued',
  );
  const failed = list.filter((item) => item.record.status === 'failed');
  const bytes = completed.reduce((sum, item) => sum + item.record.bytes, 0);

  const confirmClear = () => {
    Alert.alert('Clear all downloads?', 'Every offline file will be removed from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear all',
        style: 'destructive',
        onPress: () => void clearAll(),
      },
    ]);
  };

  if (Platform.OS === 'web') {
    return (
      <Screen contentStyle={styles.content}>
        <View style={styles.header}>
          <Text variant="eyebrow" tone="tertiary">
            OFFLINE
          </Text>
          <Text variant="display">Downloads</Text>
        </View>
        <EmptyState
          icon={ArrowDownToLine}
          title="Downloads live in the app"
          description="Offline listening needs access to the device filesystem. Open BOUND on iOS or Android to download tracks."
          actionLabel="Browse music"
          onAction={() => router.push('/(tabs)/search')}
        />
      </Screen>
    );
  }

  return (
    <Screen contentStyle={styles.content}>
      <View style={styles.header}>
        <View style={styles.headerText}>
          <Text variant="eyebrow" tone="tertiary">
            OFFLINE
          </Text>
          <Text variant="display">Downloads</Text>
        </View>
        {completed.length > 0 ? (
          <IconButton
            icon={Trash2}
            accessibilityLabel="Clear all downloads"
            onPress={confirmClear}
          />
        ) : null}
      </View>

      {list.length === 0 ? (
        <EmptyState
          icon={ArrowDownToLine}
          title="Nothing downloaded"
          description="Download a track from its menu to listen without a connection."
          actionLabel="Find music"
          onAction={() => router.push('/(tabs)/search')}
        />
      ) : (
        <>
          <View style={[styles.summary, { backgroundColor: colors.surfaceSolid, borderColor: colors.border }]}>
            <View style={styles.summaryItem}>
              <Text variant="title">{completed.length}</Text>
              <Text variant="caption" tone="tertiary">
                OFFLINE TRACKS
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text variant="title">{formatBytes(bytes)}</Text>
              <Text variant="caption" tone="tertiary">
                ON THIS DEVICE
              </Text>
            </View>
            <View style={[styles.divider, { backgroundColor: colors.border }]} />
            <View style={styles.summaryItem}>
              <Text variant="title">{active.length}</Text>
              <Text variant="caption" tone="tertiary">
                IN PROGRESS
              </Text>
            </View>
          </View>

          {active.length > 0 ? (
            <View style={styles.section}>
              <Text variant="heading">In progress</Text>
              {active.map(({ record, track }) => (
                <View
                  key={record.trackId}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHead}>
                    <View style={styles.cardText}>
                      <Text variant="bodySemibold" numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Text variant="small" tone="tertiary" numberOfLines={1}>
                        {track.artistName} · {Math.round(record.progress * 100)}%
                      </Text>
                    </View>
                    <IconButton
                      icon={X}
                      size={34}
                      iconSize={16}
                      accessibilityLabel="Cancel download"
                      onPress={() => cancel(record.trackId)}
                    />
                  </View>
                  <View style={[styles.progress, { backgroundColor: colors.surfaceSunken }]}>
                    <View
                      style={[
                        styles.progressFill,
                        {
                          width: `${Math.max(record.progress * 100, 3)}%`,
                          backgroundColor: colors.accent,
                        },
                      ]}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {failed.length > 0 ? (
            <View style={styles.section}>
              <Text variant="heading">Needs attention</Text>
              {failed.map(({ record, track }) => (
                <View
                  key={record.trackId}
                  style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
                  <View style={styles.cardHead}>
                    <View style={styles.cardText}>
                      <Text variant="bodySemibold" numberOfLines={1}>
                        {track.title}
                      </Text>
                      <Text variant="small" tone="danger" numberOfLines={2}>
                        {record.error ?? 'Download failed.'}
                      </Text>
                    </View>
                    <IconButton
                      icon={RefreshCw}
                      size={34}
                      iconSize={16}
                      accessibilityLabel="Retry download"
                      onPress={() => void retry(record.trackId)}
                    />
                    <IconButton
                      icon={Trash2}
                      size={34}
                      iconSize={16}
                      accessibilityLabel="Remove download"
                      onPress={() => void remove(record.trackId)}
                    />
                  </View>
                </View>
              ))}
            </View>
          ) : null}

          {completed.length > 0 ? (
            <View style={styles.section}>
              <Text variant="heading">Available offline</Text>
              {completed.map(({ record, track }) => (
                <Pressable
                  key={record.trackId}
                  onPress={() => playTrack(track.id, 'Downloads')}
                  style={({ pressed }) => [
                    styles.trackRow,
                    { backgroundColor: pressed ? colors.surface : 'transparent' },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={`Play ${track.title}`}>
                  <View
                    style={[
                      styles.check,
                      { backgroundColor: colors.accentSoft, borderColor: colors.accentBorder },
                    ]}>
                    <Check size={13} color={colors.accent} strokeWidth={2.6} />
                  </View>
                  <View style={styles.cardText}>
                    <Text variant="bodySemibold" numberOfLines={1}>
                      {track.title}
                    </Text>
                    <Text variant="small" tone="tertiary" numberOfLines={1}>
                      {track.artistName} · {formatBytes(record.bytes)} ·{' '}
                      {STATUS_LABEL[record.status]}
                    </Text>
                  </View>
                  <IconButton
                    icon={Trash2}
                    size={34}
                    iconSize={16}
                    accessibilityLabel="Remove download"
                    onPress={() => void remove(record.trackId)}
                  />
                </Pressable>
              ))}
            </View>
          ) : null}
        </>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingBottom: spacing.xxxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: spacing.sm,
  },
  headerText: {
    gap: 2,
  },
  summary: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    borderWidth: StyleSheet.hairlineWidth,
    paddingVertical: spacing.lg,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  divider: {
    width: StyleSheet.hairlineWidth,
    height: 36,
  },
  section: {
    gap: spacing.sm,
  },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  cardHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  cardText: {
    flex: 1,
    gap: 2,
  },
  progress: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: 4,
  },
  trackRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 9,
    paddingHorizontal: 4,
    borderRadius: radius.sm,
  },
  check: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
