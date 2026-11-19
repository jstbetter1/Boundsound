import { useLocalSearchParams, useRouter } from 'expo-router';
import { ListMusic, MoreVertical, Play, Shuffle, Trash2 } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { Alert, StyleSheet, View } from 'react-native';

import { TrackRow } from '@/components/music/TrackRow';
import { Button } from '@/components/ui/Button';
import { CoverArt } from '@/components/ui/CoverArt';
import { EmptyState } from '@/components/ui/EmptyState';
import { IconButton } from '@/components/ui/IconButton';
import { PageHeader } from '@/components/ui/PageHeader';
import { Screen } from '@/components/ui/Screen';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import { getPlaylistById, getTracksByIds } from '@/data/catalog';
import { formatLongDuration } from '@/lib/format';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { toast } from '@/stores/toastStore';
import { radius, spacing } from '@/theme/tokens';

export default function PlaylistScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const userPlaylists = useLibraryStore((state) => state.playlists);
  const updatePlaylist = useLibraryStore((state) => state.updatePlaylist);
  const deletePlaylist = useLibraryStore((state) => state.deletePlaylist);
  const playTracks = usePlayerStore((state) => state.playTracks);

  const userPlaylist = userPlaylists.find((item) => item.id === id);
  const curated = id ? getPlaylistById(id) : undefined;
  const playlist = userPlaylist ?? curated;
  const isOwner = Boolean(userPlaylist);

  const [editing, setEditing] = useState(false);
  const [name, setName] = useState(playlist?.title ?? '');
  const [description, setDescription] = useState(playlist?.description ?? '');

  const tracks = useMemo(
    () => (playlist ? getTracksByIds(playlist.trackIds) : []),
    [playlist],
  );

  if (!playlist) {
    return (
      <Screen>
        <PageHeader />
        <EmptyState
          icon={ListMusic}
          title="Playlist not found"
          description="It may have been deleted."
          actionLabel="Go back"
          onAction={() => router.back()}
        />
      </Screen>
    );
  }

  const duration = tracks.reduce((sum, track) => sum + track.durationSec, 0);
  const ids = tracks.map((track) => track.id);

  const openEdit = () => {
    setName(playlist.title);
    setDescription(playlist.description);
    setEditing(true);
  };

  const saveEdit = () => {
    if (!name.trim()) return;
    updatePlaylist(playlist.id, { name: name.trim(), description: description.trim() });
    setEditing(false);
    toast.success('Playlist updated');
  };

  const confirmDelete = () => {
    Alert.alert('Delete playlist?', `“${playlist.title}” will be removed.`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deletePlaylist(playlist.id);
          router.back();
        },
      },
    ]);
  };

  return (
    <Screen glow={{ primary: playlist.accent }} contentStyle={styles.content}>
      <PageHeader
        right={
          isOwner ? (
            <View style={styles.headerActions}>
              <IconButton
                icon={MoreVertical}
                accessibilityLabel="Edit playlist"
                onPress={openEdit}
              />
              <IconButton
                icon={Trash2}
                accessibilityLabel="Delete playlist"
                onPress={confirmDelete}
              />
            </View>
          ) : undefined
        }
      />

      <View style={styles.hero}>
        <CoverArt artwork={playlist.artwork} size={196} radius={radius.lg} />
        <Text variant="eyebrow" tone="tertiary">
          {playlist.isSystem ? 'BOUND PLAYLIST' : 'PLAYLIST'}
        </Text>
        <Text variant="title" center style={styles.title}>
          {playlist.title}
        </Text>
        {playlist.description ? (
          <Text variant="small" tone="secondary" center style={styles.description}>
            {playlist.description}
          </Text>
        ) : null}
        <Text variant="caption" tone="tertiary" center>
          {playlist.curator} · {tracks.length} tracks · {formatLongDuration(duration)}
        </Text>
        <View style={styles.actions}>
          <Button
            label="Play"
            icon={Play}
            onPress={() => playTracks(ids, { context: playlist.title })}
            style={styles.action}
            disabled={ids.length === 0}
          />
          <Button
            label="Shuffle"
            icon={Shuffle}
            variant="secondary"
            onPress={() => playTracks(ids, { context: playlist.title, shuffle: true })}
            style={styles.action}
            disabled={ids.length === 0}
          />
        </View>
      </View>

      {tracks.length === 0 ? (
        <EmptyState
          icon={ListMusic}
          title="This playlist is empty"
          description="Add songs from any track menu to bring it to life."
          actionLabel="Find music"
          onAction={() => router.push('/(tabs)/search')}
        />
      ) : (
        <View style={styles.tracks}>
          {tracks.map((track, index) => (
            <TrackRow
              key={track.id}
              track={track}
              index={index}
              playlistId={isOwner ? playlist.id : undefined}
              onPress={() =>
                playTracks(ids, { context: playlist.title, startIndex: index })
              }
              showAlbum
            />
          ))}
        </View>
      )}

      <Sheet visible={editing} onClose={() => setEditing(false)} title="Edit playlist">
        <View style={styles.editForm}>
          <TextField label="NAME" value={name} onChangeText={setName} maxLength={60} />
          <TextField
            label="DESCRIPTION"
            placeholder="What is this playlist for?"
            value={description}
            onChangeText={setDescription}
            maxLength={160}
            multiline
          />
          <Button label="Save changes" onPress={saveEdit} fullWidth disabled={!name.trim()} />
        </View>
      </Sheet>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
  headerActions: {
    flexDirection: 'row',
  },
  hero: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.md,
    paddingBottom: spacing.xl,
  },
  title: {
    fontSize: 28,
    lineHeight: 34,
  },
  description: {
    maxWidth: 330,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    width: '100%',
  },
  action: {
    flex: 1,
  },
  tracks: {
    gap: 2,
  },
  editForm: {
    gap: spacing.md,
  },
});
