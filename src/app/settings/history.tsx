import { useRouter } from 'expo-router';
import { History, Trash2 } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { TrackRow } from '@/components/music/TrackRow';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Text } from '@/components/ui/Text';
import { getTrackById } from '@/data/catalog';
import { formatRelative } from '@/lib/format';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/toastStore';
import { spacing } from '@/theme/tokens';
import type { PlayEvent, Track } from '@/types';

type DayGroup = {
  key: string;
  label: string;
  entries: { event: PlayEvent; track: Track }[];
};

function dayLabel(date: Date): string {
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  const time = date.getTime();
  const day = 86400000;
  if (time >= start) return 'Today';
  if (time >= start - day) return 'Yesterday';
  return date.toLocaleDateString(undefined, { weekday: 'long', month: 'short', day: 'numeric' });
}

export default function HistoryScreen() {
  const router = useRouter();
  const history = useLibraryStore((state) => state.history);
  const clearHistory = useLibraryStore((state) => state.clearHistory);
  const playTracks = usePlayerStore((state) => state.playTracks);

  const groups = useMemo(() => {
    const byDay = new Map<string, DayGroup>();
    for (const event of history) {
      const track = getTrackById(event.trackId);
      if (!track) continue;
      const date = new Date(event.playedAt);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const group = byDay.get(key) ?? { key, label: dayLabel(date), entries: [] };
      group.entries.push({ event, track });
      byDay.set(key, group);
    }
    return [...byDay.values()];
  }, [history]);

  const confirmClear = () => {
    Alert.alert('Clear listening history?', 'This resets recent plays and taste signals.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          clearHistory();
          toast.success('History cleared');
        },
      },
    ]);
  };

  return (
    <Screen>
      <PageHeader
        title="History"
        subtitle={`${history.length} recent play${history.length === 1 ? '' : 's'}`}
        right={
          history.length > 0 ? (
            <IconButton
              icon={Trash2}
              accessibilityLabel="Clear listening history"
              onPress={confirmClear}
            />
          ) : undefined
        }
      />

      {groups.length === 0 ? (
        <EmptyState
          icon={History}
          title="No listening history yet"
          description="Tracks you play will appear here, grouped by day."
          actionLabel="Find something to play"
          onAction={() => router.push('/(tabs)/search')}
        />
      ) : (
        <View style={styles.content}>
          {groups.map((group) => (
            <View key={group.key} style={styles.group}>
              <Text variant="eyebrow" tone="tertiary">
                {group.label.toUpperCase()}
              </Text>
              {group.entries.map(({ event, track }) => (
                <TrackRow
                  key={event.id}
                  track={track}
                  subtitle={`${track.artistName} · ${formatRelative(event.playedAt)}`}
                  onPress={() => playTracks([track.id], { context: 'History' })}
                  showAlbum={false}
                />
              ))}
            </View>
          ))}
        </View>
      )}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: spacing.xl,
    paddingTop: spacing.md,
    paddingBottom: spacing.xxxl,
  },
  group: {
    gap: spacing.sm,
  },
});
