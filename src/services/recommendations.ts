import {
  albums,
  artistsById,
  findTrackByCanonicalKey,
  genres,
  genresById,
  getAlbumById,
  getAllTracks,
  getGenreById,
  getPlayableSource,
  getTrackById,
  makeCanonicalKey,
  popularArtists,
  popularTracks,
} from '@/data/catalog';
import { daySeed, isoWeekSeed } from '@/lib/format';
import { numericSeed, paletteFor } from '@/theme/artwork';
import type {
  Album,
  ArtworkVariant,
  Artist,
  Genre,
  GenreId,
  MoodId,
  PlayEvent,
  RadioStation,
  Track,
} from '@/types';

export type TasteInput = {
  likedTrackIds: string[];
  savedAlbumIds: string[];
  followedArtistIds: string[];
  seedGenreIds: string[];
  seedArtistIds: string[];
  history: PlayEvent[];
};

export type TasteProfile = {
  artistAffinity: Map<string, number>;
  genreAffinity: Map<GenreId, number>;
  moodAffinity: Map<MoodId, number>;
  albumAffinity: Map<string, number>;
  liked: Set<string>;
  followed: Set<string>;
  recent: Map<string, number>;
  recentOrder: string[];
  hasSignal: boolean;
};

const VARIANTS: ArtworkVariant[] = ['orbit', 'wave', 'grid', 'bloom', 'prism', 'bars', 'eclipse'];

function add(map: Map<string, number>, key: string | undefined, value: number): void {
  if (!key) return;
  map.set(key, (map.get(key) ?? 0) + value);
}

function normalize(map: Map<string, number>): void {
  let max = 0;
  map.forEach((value) => {
    if (value > max) max = value;
  });
  if (max <= 0) return;
  map.forEach((value, key) => map.set(key, value / max));
}

function variantFor(seed: string): ArtworkVariant {
  return VARIANTS[numericSeed(seed) % VARIANTS.length];
}

function seededValue(seed: string): number {
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0) / 4294967295;
}

function shuffleSeeded<T>(items: T[], seed: string): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const value = seededValue(`${seed}:${i}`);
    const j = Math.floor(value * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export function buildTasteProfile(input: TasteInput): TasteProfile {
  const artistAffinity = new Map<string, number>();
  const genreAffinity = new Map<GenreId, number>();
  const moodAffinity = new Map<MoodId, number>();
  const albumAffinity = new Map<string, number>();
  const recent = new Map<string, number>();
  const liked = new Set(input.likedTrackIds);
  const followed = new Set(input.followedArtistIds);

  const attribute = (track: Track, artistWeight: number, genreWeight: number) => {
    add(artistAffinity, track.artistId, artistWeight);
    add(genreAffinity, track.genre, genreWeight);
    track.moods.forEach((mood) => add(moodAffinity, mood, genreWeight * 0.6));
    add(albumAffinity, track.albumId, genreWeight * 0.4);
  };

  for (const trackId of input.likedTrackIds) {
    const track = getTrackById(trackId);
    if (track) attribute(track, 3.2, 1.4);
  }

  for (const albumId of input.savedAlbumIds) {
    const album = getAlbumById(albumId);
    if (!album) continue;
    add(artistAffinity, album.artistId, 2.2);
    add(genreAffinity, album.genre, 1.1);
    album.moods.forEach((mood) => add(moodAffinity, mood, 0.6));
    add(albumAffinity, album.id, 1.2);
  }

  for (const artistId of input.followedArtistIds) {
    const artist = artistsById.get(artistId);
    if (!artist) continue;
    add(artistAffinity, artist.id, 4.5);
    artist.genres.forEach((genre) => add(genreAffinity, genre, 1.6));
  }

  input.seedGenreIds.forEach((genreId) => add(genreAffinity, genreId, 3.2));
  input.seedArtistIds.forEach((artistId) => {
    const artist = artistsById.get(artistId);
    if (!artist) return;
    add(artistAffinity, artist.id, 4);
    artist.genres.forEach((genre) => add(genreAffinity, genre, 1.4));
  });

  input.history.slice(0, 60).forEach((event, index) => {
    const track = getTrackById(event.trackId);
    if (!track) return;
    recent.set(track.id, (recent.get(track.id) ?? 0) + 1);
    const recency = Math.pow(0.92, index);
    const signal = event.completed ? 1.1 : event.skipped ? -0.25 : 0.5;
    const weight = recency * signal;
    if (weight > 0) attribute(track, 1.1 * weight, 0.55 * weight);
    else add(artistAffinity, track.artistId, 0.35 * weight);
  });

  normalize(artistAffinity);
  normalize(genreAffinity);
  normalize(moodAffinity);
  normalize(albumAffinity);

  const hasSignal =
    input.likedTrackIds.length > 0 ||
    input.savedAlbumIds.length > 0 ||
    input.followedArtistIds.length > 0 ||
    input.seedGenreIds.length > 0 ||
    input.seedArtistIds.length > 0 ||
    input.history.length > 0;

  return {
    artistAffinity,
    genreAffinity,
    moodAffinity,
    albumAffinity,
    liked,
    followed,
    recent,
    recentOrder: input.history.slice(0, 80).map((event) => event.trackId),
    hasSignal,
  };
}

function candidateTracks(showExplicit: boolean, genresFilter?: Set<GenreId>): Track[] {
  return getAllTracks().filter((track) => {
    if (!showExplicit && track.explicit) return false;
    if (genresFilter && !genresFilter.has(track.genre)) return false;
    return Boolean(getPlayableSource(track));
  });
}

function affinityFor(profile: TasteProfile, track: Track): number {
  const artist = track.artistId ? profile.artistAffinity.get(track.artistId) ?? 0 : 0;
  const genre = profile.genreAffinity.get(track.genre) ?? 0;
  const mood = track.moods.reduce(
    (sum, id) => sum + (profile.moodAffinity.get(id) ?? 0),
    0,
  );
  const album = track.albumId ? profile.albumAffinity.get(track.albumId) ?? 0 : 0;
  const followedBoost = track.artistId && profile.followed.has(track.artistId) ? 1 : 0;
  const likedBoost = profile.liked.has(track.id) ? 1 : 0;
  return artist * 3.4 + genre * 1.8 + mood * 1.1 + album * 0.9 + followedBoost + likedBoost;
}

function recentPenalty(profile: TasteProfile, trackId: string): number {
  const index = profile.recentOrder.indexOf(trackId);
  if (index === -1) return 0;
  if (index < 6) return 4.2;
  if (index < 18) return 2.4;
  if (index < 40) return 1.1;
  return 0.4;
}

export function personalizedTracks(
  profile: TasteProfile,
  options: {
    limit?: number;
    showExplicit?: boolean;
    exclude?: Set<string>;
    genres?: GenreId[];
    moods?: MoodId[];
    seed?: string;
    novelty?: number;
  } = {},
): Track[] {
  const {
    limit = 20,
    showExplicit = true,
    exclude = new Set<string>(),
    genres: genreList,
    moods,
    seed = daySeed(),
    novelty = 0.9,
  } = options;
  const genreFilter = genreList ? new Set(genreList) : undefined;
  const pool = candidateTracks(showExplicit, genreFilter).filter(
    (track) => !exclude.has(track.id) && (!moods || track.moods.some((mood) => moods.includes(mood))),
  );
  const scored = pool.map((track) => {
    const base = profile.hasSignal
      ? affinityFor(profile, track)
      : track.popularity / 22 + (track.featured ? 1.4 : 0);
    const popularity = track.popularity / 130;
    const jitter = seededValue(`${seed}:${track.id}`) * novelty;
    const penalty = recentPenalty(profile, track.id);
    return { track, score: base + popularity + jitter - penalty };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, limit).map((entry) => entry.track);
}

export type DailyMix = {
  id: string;
  title: string;
  subtitle: string;
  trackIds: string[];
  artwork: { seed: string; variant: ArtworkVariant; palette?: string };
  accent: string;
};

export function getDailyMixes(
  profile: TasteProfile,
  count = 6,
  showExplicit = true,
): DailyMix[] {
  const topGenres = getTopGenres(profile, count);
  const fallback = genres.filter((genre) => genre.featured);
  const genrePool = topGenres.length > 0 ? topGenres : fallback;
  const day = daySeed();
  const mixes: DailyMix[] = [];
  for (let index = 0; index < count; index += 1) {
    const genre = genrePool[index % genrePool.length];
    const related = genre.related.slice(0, 2);
    const focus: GenreId[] = [genre.id, ...related];
    const seed = `${day}:daily-mix:${index}`;
    const primary = personalizedTracks(profile, {
      genres: focus,
      limit: 22,
      seed,
      showExplicit,
      novelty: 1.1,
    });
    if (primary.length < 8) {
      const seen = new Set(primary.map((track) => track.id));
      const fill = personalizedTracks(profile, {
        limit: 18,
        seed: `${seed}:fill`,
        showExplicit,
        exclude: seen,
      });
      primary.push(...fill);
    }
    const trackIds = primary.slice(0, 22).map((track) => track.id);
    if (trackIds.length === 0) continue;
    const genreNames = focus.map((id) => getGenreById(id)?.name ?? id);
    mixes.push({
      id: `${day}-mix-${index}`,
      title: `Daily Mix ${index + 1}`,
      subtitle: genreNames.join(' · '),
      trackIds,
      artwork: { seed: `${day}-mix-${index}`, variant: variantFor(`${day}-${genre.id}-${index}`) },
      accent: genre.accent,
    });
  }
  return mixes;
}

export function getTopGenres(profile: TasteProfile, limit = 6): Genre[] {
  const entries = [...profile.genreAffinity.entries()].sort((a, b) => b[1] - a[1]);
  const result = entries
    .map(([id]) => genresById.get(id))
    .filter((genre): genre is Genre => Boolean(genre));
  if (result.length >= limit) return result.slice(0, limit);
  const seen = new Set(result.map((genre) => genre.id));
  for (const genre of genres.filter((item) => item.featured)) {
    if (!seen.has(genre.id)) {
      result.push(genre);
      seen.add(genre.id);
    }
    if (result.length >= limit) break;
  }
  return result.slice(0, limit);
}

export function getTopArtists(profile: TasteProfile, limit = 8): Artist[] {
  const entries = [...profile.artistAffinity.entries()].sort((a, b) => b[1] - a[1]);
  const result = entries
    .map(([id]) => artistsById.get(id))
    .filter((artist): artist is Artist => Boolean(artist));
  if (result.length >= limit) return result.slice(0, limit);
  const seen = new Set(result.map((artist) => artist.id));
  for (const artist of popularArtists) {
    if (!seen.has(artist.id)) {
      result.push(artist);
      seen.add(artist.id);
    }
    if (result.length >= limit) break;
  }
  return result.slice(0, limit);
}

export function getBecauseYouLike(
  profile: TasteProfile,
  showExplicit = true,
  limit = 2,
): { artist: Artist; tracks: Track[] }[] {
  const topArtists = getTopArtists(profile, 3).filter((artist) =>
    profile.artistAffinity.has(artist.id),
  );
  const source = topArtists.length > 0 ? topArtists : popularArtists.slice(0, 2);
  return source.slice(0, limit).map((artist) => {
    const own = personalizedTracks(profile, {
      limit: 14,
      showExplicit,
      seed: `${isoWeekSeed()}:because:${artist.id}`,
      genres: artist.genres,
    }).filter((track) => track.artistId !== artist.id);
    const tracks = own.length >= 6 ? own : popularTracks.filter((track) => track.artistId !== artist.id).slice(0, 10);
    return { artist, tracks };
  });
}

export function getFreshPicks(profile: TasteProfile, showExplicit = true, limit = 12): Album[] {
  const topGenres = new Set(getTopGenres(profile, 5).map((genre) => genre.id));
  return [...albums]
    .filter((album) => topGenres.size === 0 || topGenres.has(album.genre))
    .sort((a, b) => b.releaseDate.localeCompare(a.releaseDate))
    .slice(0, limit);
}

export function getDeepCuts(profile: TasteProfile, showExplicit = true, limit = 12): Track[] {
  return personalizedTracks(profile, {
    limit: limit * 2,
    showExplicit,
    seed: `${isoWeekSeed()}:deep`,
  })
    .filter((track) => track.popularity < 70)
    .slice(0, limit);
}

export function getRadioTracks(
  seedTrackId: string,
  profile: TasteProfile,
  showExplicit = true,
  count = 30,
): Track[] {
  const seedTrack = getTrackById(seedTrackId);
  const candidates = candidateTracks(showExplicit).filter((track) => track.id !== seedTrackId);
  if (!seedTrack) return personalizedTracks(profile, { limit: count, showExplicit });
  const scored = candidates.map((track) => {
    let similarity = 0;
    if (track.genre === seedTrack.genre) similarity += 3;
    const sharedMoods = track.moods.filter((mood) => seedTrack.moods.includes(mood)).length;
    similarity += sharedMoods * 1.4;
    if (track.artistId && track.artistId === seedTrack.artistId) similarity += 1.2;
    similarity -= Math.abs(track.energy - seedTrack.energy) * 2.2;
    similarity -= Math.abs(track.valence - seedTrack.valence) * 1.2;
    similarity -= Math.min(Math.abs(track.tempo - seedTrack.tempo) / 60, 2);
    const affinity = affinityFor(profile, track) * 0.7;
    const jitter = seededValue(`${seedTrackId}:radio:${track.id}`) * 0.8;
    const penalty = recentPenalty(profile, track.id) * 1.3;
    return { track, score: similarity + affinity + jitter - penalty };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.slice(0, count).map((entry) => entry.track);
}

export function getSimilarTracks(
  trackId: string,
  profile: TasteProfile,
  count = 12,
  showExplicit = true,
): Track[] {
  return getRadioTracks(trackId, profile, showExplicit, count);
}

export function getMoodStations(showExplicit = true): RadioStation[] {
  const definitions: {
    id: string;
    title: string;
    description: string;
    moods: MoodId[];
    accent: string;
  }[] = [
    { id: 'nocturne', title: 'Nocturne', description: 'After-midnight textures for the wide awake.', moods: ['nocturnal'], accent: '#8B7CFF' },
    { id: 'focus', title: 'Deep Focus', description: 'Low-friction instrumentals that hold the line.', moods: ['focus', 'calm'], accent: '#66D9E8' },
    { id: 'uplift', title: 'Lift', description: 'Bright edges, open windows, forward motion.', moods: ['uplift', 'energy'], accent: '#C8F751' },
    { id: 'melancholy', title: 'Blue Hour', description: 'For the soft ache of a good memory.', moods: ['melancholy'], accent: '#FF7AA8' },
    { id: 'drive', title: 'Night Drive', description: 'Headlights, empty lanes, steady pulse.', moods: ['drive', 'energy'], accent: '#FFC96B' },
    { id: 'romance', title: 'Slow Burn', description: 'Close-up songs for two people and a room.', moods: ['romance'], accent: '#FF9364' },
    { id: 'calm', title: 'Soft Landing', description: 'Nothing urgent. Nowhere to be.', moods: ['calm'], accent: '#9ED6A6' },
    { id: 'energy', title: 'High Voltage', description: 'Maximum lift for the final set.', moods: ['energy'], accent: '#C8F751' },
  ];
  return definitions.map((definition) => {
    const day = daySeed();
    const pool = candidateTracks(showExplicit).filter((track) =>
      track.moods.some((mood) => definition.moods.includes(mood)),
    );
    const trackIds = shuffleSeeded(pool, `${day}:station:${definition.id}`)
      .slice(0, 35)
      .map((track) => track.id);
    return {
      id: `mood-${definition.id}`,
      title: definition.title,
      description: definition.description,
      trackIds,
      artwork: {
        seed: `mood-${definition.id}-${isoWeekSeed()}`,
        variant: variantFor(definition.id),
      },
      accent: definition.accent,
    };
  });
}

export function getStationById(id: string, showExplicit = true): RadioStation | undefined {
  return getMoodStations(showExplicit).find((station) => station.id === id);
}

export function getMixById(id: string, profile: TasteProfile, showExplicit = true): DailyMix | undefined {
  return getDailyMixes(profile, 6, showExplicit).find((mix) => mix.id === id);
}

export function getImportedRecommendationIds(profile: TasteProfile): string[] {
  return [...profile.liked];
}

export function resolveImportedTrack(title: string, artist: string): Track | undefined {
  return findTrackByCanonicalKey(makeCanonicalKey(title, artist));
}

export function artworkForMix(seed: string, accent?: string): { seed: string; variant: ArtworkVariant; palette?: string } {
  return { seed, variant: variantFor(seed), palette: accent ? paletteFor(seed, accent).id : undefined };
}
