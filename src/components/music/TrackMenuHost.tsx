import {
  CornerDownRight,
  Disc3,
  Download,
  Heart,
  ListEnd,
  ListPlus,
  MinusCircle,
  Play,
  Plus,
  Radio,
  Share2,
  Trash2,
  User,
} from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { Alert, Platform, Share, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';

import { Button } from '@/components/ui/Button';
import { CoverArt } from '@/components/ui/CoverArt';
import { ListRow, RowDivider } from '@/components/ui/ListRow';
import { Sheet } from '@/components/ui/Sheet';
import { Text } from '@/components/ui/Text';
import { TextField } from '@/components/ui/TextField';
import {
  getAlbumById,
  getArtistById,
  getTrackById,
  resolveTrackSources,
} from '@/data/catalog';
import { tap } from '@/lib/haptics';
import { getRadioTracks } from '@/services/recommendations';
import { useDownloadsStore } from '@/stores/downloadsStore';
import { useLibraryStore } from '@/stores/libraryStore';
import { usePlayerStore } from '@/stores/playerStore';
import { usePreferencesStore } from '@/stores/preferencesStore';
import { toast } from '@/stores/toastStore';
import { useTrackMenuStore } from '@/stores/trackMenuStore';
import { useTasteProfile } from '@/hooks/useTasteProfile';
import { useTheme } from '@/theme/ThemeProvider';
import { radius } from '@/theme/tokens';

type Mode = 'actions' | 'playlist' | 'create';

export function TrackMenuHost() {
  const { colors } = useTheme();
  const router = useRouter();
  const trackId = useTrackMenuStore((state) => state.trackId);
  const playlistId = useTrackMenuStore((state) => state.playlistId);
  const close = useTrackMenuStore((state) => state.close);

  const [mode, setMode] = useState<Mode>('actions');
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  const track = trackId ? getTrackById(trackId) : undefined;
  const artist = track ? getArtistById(track.artistId) : undefined;
  const album = track ? getAlbumById(track.albumId) : undefined;

  const liked = useLibraryStore((state) => (track ? Boolean(state.liked[track.id]) : false));
  const toggleLike = useLibraryStore((state) => state.toggleLike);
  const playlists = useLibraryStore((state) => state.playlists);
  const addTracksToPlaylist = useLibraryStore((state) => state.addTracksToPlaylist);
  const removeTrackFromPlaylist = useLibraryStore((state) => state.removeTrackFromPlaylist);
  const createPlaylist = useLibraryStore((state) => state.createPlaylist);

  const record = useDownloadsStore((state) => (track ? state.records[track.id] : undefined));
  const download = useDownloadsStore((state) => state.download);
  const removeDownload = useDownloadsStore((state) => state.remove);
  const cancelDownload = useDownloadsStore((state) => state.cancel);

  const playTrack = usePlayerStore((state) => state.playTrack);
  const playNext = usePlayerStore((state) => state.playNext);
  const addToQueue = usePlayerStore((state) => state.addToQueue);
  const playTracks = usePlayerStore((state) => state.playTracks);
  const profile = useTasteProfile();
  const showExplicit = usePreferencesStore((state) => state.preferences.showExplicit);

  useEffect(() => {
    if (trackId) {
      setMode('actions');
      setNewName('');
    }
  }, [trackId]);

  if (!track) {
    return <Sheet visible={false} onClose={close}>{null}</Sheet>;
  }

  const sources = resolveTrackSources(track);
  const canDownload = sources.some((source) => source.downloadable && source.streamUrl);
  const externalUrl = sources.find((source) => source.externalUrl)?.externalUrl;

  const finish = (message?: string) => {
    if (message) toast.success(message);
    close();
  };

  const handleLike = () => {
    const nowLiked = toggleLike(track.id);
    tap();
    finish(nowLiked ? 'Added to Liked Songs' : 'Removed from Liked Songs');
  };

  const handleDownload = async () => {
    if (Platform.OS === 'web') {
      toast.show('Downloads are available in the native app.');
      return;
    }
    if (!canDownload) {
      toast.show('This track has no downloadable source.');
      return;
    }
    close();
    void download(track.id);
  };

  const handleShare = async () => {
    close();
    try {
      await Share.share({
        message: externalUrl
          ? `${track.title} — ${track.artistName}\n${externalUrl}`
          : `I'm listening to ${track.title} by ${track.artistName} on BOUND.`,
      });
    } catch {
      toast.show('Sharing was cancelled.');
    }
  };

  const handleRemoveDownload = () => {
    Alert.alert('Remove download?', 'The file will be deleted from this device.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Remove',
        style: 'destructive',
        onPress: () => {
          close();
          void removeDownload(track.id);
        },
      },
    ]);
  };

  const startRadio = () => {
    const radio = getRadioTracks(track.id, profile, showExplicit, 30);
    if (radio.length === 0) {
      toast.show('Not enough music for a radio station yet.');
      return;
    }
    close();
    playTracks([track.id, ...radio.map((item) => item.id)], {
      context: `${track.title} Radio`,
      shuffle: false,
    });
    toast.show(`Radio started from ${track.title}`);
  };

  const handleCreate = () => {
    if (!newName.trim()) return;
    setCreating(true);
    const playlist = createPlaylist({ name: newName, trackIds: [track.id] });
    setCreating(false);
    if (playlist) finish(`Added to ${playlist.title}`);
    else toast.error('Could not create playlist.');
  };

  return (
    <Sheet visible={Boolean(trackId)} onClose={close} title={mode === 'actions' ? 'Track options' : mode === 'playlist' ? 'Add to playlist' : 'New playlist'}>
      {mode === 'actions' ? (
        <View style={styles.content}>
          <View style={styles.trackHead}>
            <CoverArt artwork={track.artwork} size={52} radius={radius.sm} />
            <View style={styles.trackText}>
              <Text variant="bodySemibold" numberOfLines={1}>
                {track.title}
              </Text>
              <Text variant="small" tone="tertiary" numberOfLines={1}>
                {track.artistName}
                {album ? ` · ${album.title}` : ''}
              </Text>
            </View>
          </View>
          <View style={styles.actions}>
            <ListRow
              title="Play now"
              icon={Play}
              onPress={() => {
                close();
                playTrack(track.id, track.title);
              }}
              showChevron={false}
            />
            <ListRow
              title="Play next"
              icon={CornerDownRight}
              onPress={() => {
                playNext([track.id]);
                finish('Playing next');
              }}
              showChevron={false}
            />
            <ListRow
              title="Add to queue"
              icon={ListEnd}
              onPress={() => {
                addToQueue([track.id]);
                finish('Added to queue');
              }}
              showChevron={false}
            />
            <RowDivider />
            <ListRow
              title={liked ? 'Remove from Liked Songs' : 'Like song'}
              icon={Heart}
              iconColor={liked ? colors.accent : undefined}
              onPress={handleLike}
              showChevron={false}
            />
            <ListRow
              title="Add to playlist"
              icon={ListPlus}
              onPress={() => setMode('playlist')}
            />
            {playlistId ? (
              <ListRow
                title="Remove from this playlist"
                icon={MinusCircle}
                destructive
                onPress={() => {
                  removeTrackFromPlaylist(playlistId, track.id);
                  finish('Removed from playlist');
                }}
                showChevron={false}
              />
            ) : null}
            <RowDivider />
            {record?.status === 'completed' ? (
              <ListRow
                title="Remove download"
                subtitle="Stored on this device"
                icon={Trash2}
                destructive
                onPress={handleRemoveDownload}
                showChevron={false}
              />
            ) : record?.status === 'downloading' || record?.status === 'queued' ? (
              <ListRow
                title="Cancel download"
                subtitle={`${Math.round((record.progress ?? 0) * 100)}% downloaded`}
                icon={Download}
                onPress={() => {
                  cancelDownload(track.id);
                  finish('Download cancelled');
                }}
                showChevron={false}
              />
            ) : (
              <ListRow
                title="Download"
                subtitle={
                  Platform.OS === 'web'
                    ? 'Available in the native app'
                    : canDownload
                      ? 'Listen offline'
                      : 'No downloadable source'
                }
                icon={Download}
                onPress={handleDownload}
                disabled={Platform.OS === 'web' || !canDownload}
                showChevron={false}
              />
            )}
            <ListRow
              title="Start radio"
              subtitle={`Songs similar to ${track.title}`}
              icon={Radio}
              onPress={startRadio}
              showChevron={false}
            />
            <RowDivider />
            {artist ? (
              <ListRow
                title="Go to artist"
                icon={User}
                onPress={() => {
                  close();
                  router.push(`/artist/${artist.id}`);
                }}
              />
            ) : null}
            {album ? (
              <ListRow
                title="Go to album"
                icon={Disc3}
                onPress={() => {
                  close();
                  router.push(`/album/${album.id}`);
                }}
              />
            ) : null}
            <ListRow title="Share" icon={Share2} onPress={handleShare} showChevron={false} />
          </View>
        </View>
      ) : mode === 'playlist' ? (
        <View style={styles.content}>
          {playlists.length === 0 ? (
            <View style={styles.empty}>
              <Text variant="body" tone="secondary" style={styles.emptyText}>
                You don’t have any playlists yet.
              </Text>
            </View>
          ) : (
            <View style={styles.actions}>
              {playlists.map((playlist) => (
                <ListRow
                  key={playlist.id}
                  title={playlist.title}
                  subtitle={`${playlist.trackIds.length} track${playlist.trackIds.length === 1 ? '' : 's'}`}
                  icon={ListPlus}
                  onPress={() => {
                    addTracksToPlaylist(playlist.id, [track.id]);
                    finish(`Added to ${playlist.title}`);
                  }}
                  showChevron={false}
                />
              ))}
            </View>
          )}
          <Button
            label="New playlist"
            icon={Plus}
            variant="secondary"
            onPress={() => setMode('create')}
          />
        </View>
      ) : (
        <View style={styles.content}>
          <Text variant="body" tone="secondary">
            Create a playlist for “{track.title}”.
          </Text>
          <TextField
            label="PLAYLIST NAME"
            placeholder="Late night drives"
            value={newName}
            onChangeText={setNewName}
            autoFocus
            maxLength={60}
            returnKeyType="done"
            onSubmitEditing={handleCreate}
          />
          <Button
            label="Create playlist"
            onPress={handleCreate}
            disabled={!newName.trim()}
            loading={creating}
            fullWidth
          />
        </View>
      )}
    </Sheet>
  );
}

const styles = StyleSheet.create({
  content: {
    gap: 14,
  },
  trackHead: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingBottom: 2,
  },
  trackText: {
    flex: 1,
    gap: 2,
  },
  actions: {
    gap: 2,
  },
  empty: {
    paddingVertical: 26,
    alignItems: 'center',
  },
  emptyText: {
    textAlign: 'center',
  },
});
