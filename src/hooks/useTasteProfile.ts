import { useMemo } from 'react';

import { buildTasteProfile, type TasteInput, type TasteProfile } from '@/services/recommendations';
import { useLibraryStore } from '@/stores/libraryStore';

export function useTasteInput(): TasteInput {
  const liked = useLibraryStore((state) => state.liked);
  const savedAlbums = useLibraryStore((state) => state.savedAlbums);
  const followedArtists = useLibraryStore((state) => state.followedArtists);
  const seedGenres = useLibraryStore((state) => state.seedGenres);
  const seedArtists = useLibraryStore((state) => state.seedArtists);
  const history = useLibraryStore((state) => state.history);

  return useMemo(
    () => ({
      likedTrackIds: Object.entries(liked)
        .sort((a, b) => b[1] - a[1])
        .map(([trackId]) => trackId),
      savedAlbumIds: Object.entries(savedAlbums)
        .sort((a, b) => b[1] - a[1])
        .map(([albumId]) => albumId),
      followedArtistIds: Object.entries(followedArtists)
        .sort((a, b) => b[1] - a[1])
        .map(([artistId]) => artistId),
      seedGenreIds: Object.keys(seedGenres),
      seedArtistIds: seedArtists,
      history,
    }),
    [followedArtists, history, liked, savedAlbums, seedArtists, seedGenres],
  );
}

export function useTasteProfile(): TasteProfile {
  const input = useTasteInput();
  return useMemo(() => buildTasteProfile(input), [input]);
}
