import { create } from 'zustand';

import {
  addRecentSearch,
  appendTracksToPlaylist,
  clearPlayHistory,
  clearRecentSearches,
  createPlaylistRecord,
  deletePlaylistRecord,
  getAccountPlaylist,
  getSeedArtistIds,
  getSeedGenreWeights,
  listAccountPlaylists,
  listFollowedRows,
  listImportedRows,
  listLikedRows,
  listPlayEvents,
  listRecentSearches,
  listSavedAlbumRows,
  markTrackImported,
  recordPlayStart,
  removeRecentSearch,
  removeTrackFromPlaylist,
  reorderPlaylistTracks,
  setAlbumSaved,
  setArtistFollowed,
  setSeedArtists,
  setSeedGenres,
  setTrackLiked,
  unmarkTrackImported,
  updatePlayEvent,
  updatePlaylistRecord,
} from '@/db/library';
import { createId } from '@/lib/ids';
import { paletteFor, numericSeed } from '@/theme/artwork';
import type {
  ArtworkVariant,
  ImportedTrackRow,
  PlayEvent,
  Playlist,
  ProviderId,
} from '@/types';

const VARIANTS: ArtworkVariant[] = ['orbit', 'wave', 'grid', 'bloom', 'prism', 'bars', 'eclipse'];

function variantFor(seed: string): ArtworkVariant {
  return VARIANTS[numericSeed(seed) % VARIANTS.length];
}

type LibraryState = {
  accountId: string | null;
  hydrated: boolean;
  liked: Record<string, number>;
  savedAlbums: Record<string, number>;
  followedArtists: Record<string, number>;
  playlists: Playlist[];
  history: PlayEvent[];
  recentSearches: { query: string; searchedAt: number }[];
  seedGenres: Record<string, number>;
  seedArtists: string[];
  imported: ImportedTrackRow[];

  hydrate: (accountId: string) => void;
  unload: () => void;
  toggleLike: (trackId: string) => boolean;
  toggleSaveAlbum: (albumId: string) => boolean;
  toggleFollowArtist: (artistId: string) => boolean;
  createPlaylist: (input: {
    name: string;
    description?: string;
    trackIds?: string[];
  }) => Playlist | null;
  updatePlaylist: (
    playlistId: string,
    patch: { name?: string; description?: string; coverSeed?: string; coverVariant?: ArtworkVariant; accent?: string },
  ) => void;
  deletePlaylist: (playlistId: string) => void;
  addTracksToPlaylist: (playlistId: string, trackIds: string[]) => void;
  removeTrackFromPlaylist: (playlistId: string, trackId: string) => void;
  reorderPlaylist: (playlistId: string, orderedTrackIds: string[]) => void;
  startPlayEvent: (trackId: string, context: string) => string | null;
  finalizePlayEvent: (
    eventId: string,
    patch: { secondsPlayed: number; completed: boolean; skipped: boolean },
  ) => void;
  refreshHistory: () => void;
  clearHistory: () => void;
  addSearch: (query: string) => void;
  removeSearch: (query: string) => void;
  clearSearches: () => void;
  saveSeeds: (genreIds: string[], artistIds: string[]) => void;
  addImported: (trackId: string, provider: ProviderId) => void;
  removeImported: (trackId: string) => void;
};

const EMPTY: Pick<
  LibraryState,
  | 'liked'
  | 'savedAlbums'
  | 'followedArtists'
  | 'playlists'
  | 'history'
  | 'recentSearches'
  | 'seedGenres'
  | 'seedArtists'
  | 'imported'
> = {
  liked: {},
  savedAlbums: {},
  followedArtists: {},
  playlists: [],
  history: [],
  recentSearches: [],
  seedGenres: {},
  seedArtists: [],
  imported: [],
};

export const useLibraryStore = create<LibraryState>()((set, get) => ({
  accountId: null,
  hydrated: false,
  ...EMPTY,

  hydrate: (accountId) => {
    const liked = Object.fromEntries(
      listLikedRows(accountId).map((row) => [row.track_id, row.liked_at]),
    );
    const savedAlbums = Object.fromEntries(
      listSavedAlbumRows(accountId).map((row) => [row.album_id, row.saved_at]),
    );
    const followedArtists = Object.fromEntries(
      listFollowedRows(accountId).map((row) => [row.artist_id, row.followed_at]),
    );
    set({
      accountId,
      hydrated: true,
      liked,
      savedAlbums,
      followedArtists,
      playlists: listAccountPlaylists(accountId),
      history: listPlayEvents(accountId),
      recentSearches: listRecentSearches(accountId),
      seedGenres: getSeedGenreWeights(accountId),
      seedArtists: getSeedArtistIds(accountId),
      imported: listImportedRows(accountId),
    });
  },

  unload: () => set({ accountId: null, hydrated: false, ...EMPTY }),

  toggleLike: (trackId) => {
    const { accountId, liked } = get();
    if (!accountId) return false;
    const next = !liked[trackId];
    setTrackLiked(accountId, trackId, next, Date.now());
    set((state) => {
      const copy = { ...state.liked };
      if (next) copy[trackId] = Date.now();
      else delete copy[trackId];
      return { liked: copy };
    });
    return next;
  },

  toggleSaveAlbum: (albumId) => {
    const { accountId, savedAlbums } = get();
    if (!accountId) return false;
    const next = !savedAlbums[albumId];
    setAlbumSaved(accountId, albumId, next, Date.now());
    set((state) => {
      const copy = { ...state.savedAlbums };
      if (next) copy[albumId] = Date.now();
      else delete copy[albumId];
      return { savedAlbums: copy };
    });
    return next;
  },

  toggleFollowArtist: (artistId) => {
    const { accountId, followedArtists } = get();
    if (!accountId) return false;
    const next = !followedArtists[artistId];
    setArtistFollowed(accountId, artistId, next, Date.now());
    set((state) => {
      const copy = { ...state.followedArtists };
      if (next) copy[artistId] = Date.now();
      else delete copy[artistId];
      return { followedArtists: copy };
    });
    return next;
  },

  createPlaylist: ({ name, description = '', trackIds = [] }) => {
    const { accountId } = get();
    if (!accountId) return null;
    const trimmed = name.trim();
    if (!trimmed) return null;
    const now = Date.now();
    const id = createId();
    const seed = `${trimmed}-${now}`;
    const palette = paletteFor(seed);
    const playlist = createPlaylistRecord({
      id,
      accountId,
      name: trimmed,
      description: description.trim(),
      coverSeed: seed,
      coverVariant: variantFor(seed),
      accent: palette.accent,
      trackIds,
      now,
    });
    set((state) => ({ playlists: [playlist, ...state.playlists] }));
    return playlist;
  },

  updatePlaylist: (playlistId, patch) => {
    const { accountId } = get();
    if (!accountId) return;
    const ok = updatePlaylistRecord(playlistId, accountId, patch, Date.now());
    if (!ok) return;
    const fresh = getAccountPlaylist(playlistId, accountId);
    if (!fresh) return;
    set((state) => ({
      playlists: state.playlists.map((playlist) =>
        playlist.id === playlistId ? fresh : playlist,
      ),
    }));
  },

  deletePlaylist: (playlistId) => {
    const { accountId } = get();
    if (!accountId) return;
    deletePlaylistRecord(playlistId, accountId);
    set((state) => ({
      playlists: state.playlists.filter((playlist) => playlist.id !== playlistId),
    }));
  },

  addTracksToPlaylist: (playlistId, trackIds) => {
    const { accountId } = get();
    if (!accountId || trackIds.length === 0) return;
    appendTracksToPlaylist(playlistId, trackIds, Date.now());
    const fresh = getAccountPlaylist(playlistId, accountId);
    if (!fresh) return;
    set((state) => ({
      playlists: state.playlists.map((playlist) =>
        playlist.id === playlistId ? fresh : playlist,
      ),
    }));
  },

  removeTrackFromPlaylist: (playlistId, trackId) => {
    const { accountId } = get();
    if (!accountId) return;
    removeTrackFromPlaylist(playlistId, trackId, Date.now());
    set((state) => ({
      playlists: state.playlists.map((playlist) =>
        playlist.id === playlistId
          ? { ...playlist, trackIds: playlist.trackIds.filter((id) => id !== trackId) }
          : playlist,
      ),
    }));
  },

  reorderPlaylist: (playlistId, orderedTrackIds) => {
    const { accountId } = get();
    if (!accountId) return;
    reorderPlaylistTracks(playlistId, orderedTrackIds, Date.now());
    set((state) => ({
      playlists: state.playlists.map((playlist) =>
        playlist.id === playlistId ? { ...playlist, trackIds: orderedTrackIds } : playlist,
      ),
    }));
  },

  startPlayEvent: (trackId, context) => {
    const { accountId } = get();
    if (!accountId) return null;
    const eventId = createId();
    const playedAt = Date.now();
    recordPlayStart({ id: eventId, accountId, trackId, playedAt, context });
    set((state) => ({
      history: [
        {
          id: eventId,
          trackId,
          playedAt,
          secondsPlayed: 0,
          completed: false,
          skipped: false,
          context,
        },
        ...state.history,
      ].slice(0, 250),
    }));
    return eventId;
  },

  finalizePlayEvent: (eventId, patch) => {
    updatePlayEvent(eventId, patch);
    set((state) => ({
      history: state.history.map((event) =>
        event.id === eventId
          ? {
              ...event,
              secondsPlayed: Math.round(patch.secondsPlayed),
              completed: patch.completed,
              skipped: patch.skipped,
            }
          : event,
      ),
    }));
  },

  refreshHistory: () => {
    const { accountId } = get();
    if (!accountId) return;
    set({ history: listPlayEvents(accountId) });
  },

  clearHistory: () => {
    const { accountId } = get();
    if (!accountId) return;
    clearPlayHistory(accountId);
    set({ history: [] });
  },

  addSearch: (query) => {
    const { accountId } = get();
    const trimmed = query.trim();
    if (!accountId || !trimmed) return;
    addRecentSearch(accountId, trimmed, Date.now());
    set((state) => ({
      recentSearches: [
        { query: trimmed, searchedAt: Date.now() },
        ...state.recentSearches.filter(
          (item) => item.query.toLowerCase() !== trimmed.toLowerCase(),
        ),
      ].slice(0, 12),
    }));
  },

  removeSearch: (query) => {
    const { accountId } = get();
    if (!accountId) return;
    removeRecentSearch(accountId, query);
    set((state) => ({
      recentSearches: state.recentSearches.filter((item) => item.query !== query),
    }));
  },

  clearSearches: () => {
    const { accountId } = get();
    if (!accountId) return;
    clearRecentSearches(accountId);
    set({ recentSearches: [] });
  },

  saveSeeds: (genreIds, artistIds) => {
    const { accountId } = get();
    if (!accountId) return;
    setSeedGenres(accountId, genreIds);
    setSeedArtists(accountId, artistIds);
    set({
      seedGenres: Object.fromEntries(genreIds.map((id) => [id, 1])),
      seedArtists: [...new Set(artistIds)],
    });
  },

  addImported: (trackId, provider) => {
    const { accountId } = get();
    if (!accountId) return;
    markTrackImported(accountId, trackId, provider, Date.now());
    set((state) => ({
      imported: [
        { trackId, provider, importedAt: Date.now() },
        ...state.imported.filter((row) => row.trackId !== trackId),
      ],
    }));
  },

  removeImported: (trackId) => {
    const { accountId } = get();
    if (!accountId) return;
    unmarkTrackImported(accountId, trackId);
    set((state) => ({
      imported: state.imported.filter((row) => row.trackId !== trackId),
    }));
  },
}));
