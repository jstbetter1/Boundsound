import { useRouter } from 'expo-router';
import { ListMusic, Trash2, X } from 'lucide-react-native';
import React from 'react';
import { StyleSheet, View } from 'react-native';

import { TrackRow } from '@/components/music/TrackRow';
import { CoverArt } from '@/components/ui/CoverArt';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { getTrackById } from '@/data/catalog';
import { usePlayerStore } from '@/stores/playerStore';
import { useTheme } from '@/theme/ThemeProvider';
import { radius, spacing } from '@/theme/tokens';

export default function QueueScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const queue = usePlayerStore((state) => state.queue);
  const order = usePlayerStore((state) => state.order);
  const orderPosition = usePlayerStore((state) => state.orderPosition);
  const currentTrackId = usePlayerStore((state) => state.currentTrackId);
  const playFromQueue = usePlayerStore((state) => state.playFromQueue);
  const removeFromQueue = usePlayerStore((state) => state.removeFromQueue);
  const clearQueue = usePlayerStore((state) => state.clearQueue);

  const current = currentTrackId ? getTrackById(currentTrackId) : undefined;
  const upNext = order
    .slice(orderPosition + 1)
    .map((queueIndex) => queue[queueIndex])
    .filter((entry): entry is NonNullable<typeof entry> => Boolean(entry));

  return (
    <Screen>
      <PageHeader
        title="Queue"
        subtitle={`${queue.length} track${queue.length === 1 ? '' : 's'}`}
        onMore={queue.length > 0 ? clearQueue : undefined}
      />
      {queue.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="The queue is empty"
          description="Play something and the rest of the set will show up here."
          actionLabel="Browse music"
          onAction={() => {
            router.back();
            router.push('/(tabs)/search');
          }}
        />
      ) : (
        <View style={styles.content}>
          {current ? (
            <View style={styles.current}>
              <Text variant="eyebrow" tone="tertiary">
                NOW PLAYING
              </Text>
              <View style={styles.currentRow}>
                <CoverArt artwork={current.artwork} size={48} radius={radius.sm} />
                <View style={styles.currentText}>
                  <Text variant="bodySemibold" numberOfLines={1}>
                    {current.title}
                  </Text>
                  <Text variant="small" tone="tertiary" numberOfLines={1}>
                    {current.artistName}
                  </Text>
                </View>
                <IconButton
                  icon={Trash2}
                  size={34}
                  iconSize={16}
                  accessibilityLabel="Clear queue"
                  onPress={clearQueue}
                />
              </View>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
            </View>
          ) : null}

          <Text variant="heading">Next up</Text>
          {upNext.length === 0 ? (
            <Text variant="small" tone="tertiary">
              Nothing queued after this track.
            </Text>
          ) : (
            upNext.map((entry) => {
              const track = getTrackById(entry.trackId);
              if (!track) return null;
              const queueIndex = queue.findIndex((item) => item.key === entry.key);
              return (
                <View key={entry.key} style={styles.row}>
                  <View style={styles.rowMain}>
                    <TrackRow
                      track={track}
                      compact
                      showLike={false}
                      showMenu={false}
                      onPress={() => playFromQueue(queueIndex)}
                    />
                  </View>
                  <IconButton
                    icon={X}
                    size={32}
                    iconSize={15}
                    accessibilityLabel="Remove from queue"
                    onPress={() => removeFromQueue(entry.key)}
                  />
                </View>
              );
            })
          )}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.md,
    paddingTop: spacing.md,
  },
  current: {
    gap: spacing.sm,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  currentText: {
    flex: 1,
    gap: 2,
  },
  divider: {
    height: StyleSheet.hairlineWidth,
    marginTop: spacing.sm,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  rowMain: {
    flex: 1,
  },
});
