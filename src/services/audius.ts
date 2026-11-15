import {
  findTrackByCanonicalKey,
  makeCanonicalKey,
  registerExternalTrack,
  registerTrackSources,
} from '@/data/catalog';
import { saveExternalTrack, saveTrackLink } from '@/db/external';
import type { ArtworkVariant, GenreId, MoodId, Track, TrackSource } from '@/types';

const BASE_URL = 'https://api.audius.co';
const APP_NAME = 'BOUND';
const DEFAULT_LIMIT = 25;
const CACHE_TTL = 60_000;
const VARIANTS: ArtworkVariant[] = ['orbit', 'wave', 'grid', 'bloom', 'prism', 'bars', 'eclipse'];

export const AUDIUS_CREDIT = 'Independent music streamed from Audius';

type AudiusUser = {
  id?: string;
  name?: string;
  handle?: string;
};

type AudiusTrack = {
  id: string;
  title: string;
  duration: number;
  genre?: string;
  mood?: string;
  isrc?: string | null;
  is_streamable?: boolean;
  is_delete?: boolean;
  is_downloadable?: boolean;
  play_count?: number;
  release_date?: string;
  permalink?: string;
  artwork?: Record<string, string | undefined>;
  user?: AudiusUser;
};

type SearchResponse = {
  data?: AudiusTrack[];
};

const cache = new Map<string, { at: number; tracks: Track[] }>();

export function isAudiusEnabled(): boolean {
  return process.env.EXPO_PUBLIC_DISABLE_AUDIUS !== '1';
}

function hash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

function mapGenre(raw?: string): GenreId {
  const value = (raw ?? '').toLowerCase();
  if (value.includes('hip-hop') || value.includes('rap') || value.includes('trap')) return 'hiphop';
  if (value.includes('r&b') || value.includes('soul') || value.includes('gospel')) return 'rnb';
  if (value.includes('house') || value.includes('disco') || value.includes('dance')) return 'house';
  if (value.includes('techno') || value.includes('trance') || value.includes('drum')) return 'techno';
  if (value.includes('ambient') || value.includes('drone')) return 'ambient';
  if (value.includes('lo-fi') || value.includes('lofi') || value.includes('chill')) return 'lofi';
  if (value.includes('jazz')) return 'jazz';
  if (value.includes('classical') || value.includes('orchestral')) return 'classical';
  if (value.includes('soundtrack') || value.includes('cinematic')) return 'cinematic';
  if (value.includes('rock') || value.includes('metal') || value.includes('punk')) return 'rock';
  if (value.includes('afro')) return 'afrobeat';
  if (value.includes('indie') || value.includes('alternative')) return 'indie';
  if (value.includes('folk') || value.includes('country')) return 'alternative';
  if (value.includes('pop')) return 'pop';
  if (value.includes('electronic') || value.includes('electro')) return 'electronic';
  return 'electronic';
}

function mapMoods(raw?: string): MoodId[] {
  const value = (raw ?? '').toLowerCase();
  if (value.includes('peace') || value.includes('easy') || value.includes('calm')) {
    return ['calm', 'focus'];
  }
  if (value.includes('romantic') || value.includes('sensual') || value.includes('tender')) {
    return ['romance', 'nocturnal'];
  }
  if (value.includes('melanchol') || value.includes('sentimental') || value.includes('brooding')) {
    return ['melancholy', 'nocturnal'];
  }
  if (value.includes('energ') || value.includes('fiery') || value.includes('upbeat')) {
    return ['energy', 'uplift'];
  }
  if (value.includes('cool') || value.includes('sophisticated') || value.includes('serious')) {
    return ['drive', 'nocturnal'];
  }
  return ['focus'];
}

function energyFor(mood?: string): number {
  const value = (mood ?? '').toLowerCase();
  if (value.includes('energ') || value.includes('fiery') || value.includes('aggress') || value.includes('upbeat')) {
    return 0.82;
  }
  if (value.includes('peace') || value.includes('easy') || value.includes('calm')) return 0.24;
  if (value.includes('melanchol') || value.includes('brooding')) return 0.34;
  return 0.52;
}

function popularityFor(playCount?: number): number {
  const plays = Math.max(0, playCount ?? 0);
  return Math.max(30, Math.min(99, 30 + Math.round((Math.log10(plays + 1) / 6) * 69)));
}

function artworkFor(raw: AudiusTrack): string | undefined {
  const art = raw.artwork;
  return art?.['480x480'] ?? art?.['1000x1000'] ?? art?.['150x150'];
}

function toTrack(raw: AudiusTrack): Track | null {
  if (!raw?.id || !raw.title || raw.is_delete || raw.is_streamable === false) return null;
  const artistName = raw.user?.name?.trim() || raw.user?.handle || 'Audius artist';
  const canonicalKey = makeCanonicalKey(raw.title, artistName);
  const seed = `audius-${raw.id}`;
  const moodSeed = hash(seed);
  const source: TrackSource = {
    provider: 'audius',
    itemId: raw.id,
    streamUrl: `${BASE_URL}/v1/tracks/${raw.id}/stream?app_name=${APP_NAME}`,
    externalUrl: raw.permalink ? `https://audius.co${raw.permalink}` : 'https://audius.co',
    downloadable: Boolean(raw.is_downloadable),
    fullLength: true,
    quality: 'Audius stream',
  };

  const existing = findTrackByCanonicalKey(canonicalKey);
  if (existing) {
    registerTrackSources(existing.id, [source]);
    persistLink(existing.id, source);
    return existing;
  }

  const track: Track = {
    id: `audius-${raw.id}`,
    title: raw.title,
    artistName,
    durationSec: Math.max(0, raw.duration ?? 0),
    genre: mapGenre(raw.genre),
    moods: mapMoods(raw.mood),
    energy: energyFor(raw.mood),
    valence: Math.max(0.12, Math.min(0.94, energyFor(raw.mood) * 0.72 + ((moodSeed % 20) - 10) / 100)),
    tempo: 96 + (moodSeed % 58),
    releaseDate: raw.release_date?.slice(0, 10) ?? '2024-01-01',
    explicit: false,
    popularity: popularityFor(raw.play_count),
    isrc: raw.isrc ?? undefined,
    canonicalKey,
    sources: [source],
    artwork: { seed, variant: VARIANTS[moodSeed % VARIANTS.length], palette: 'iris' },
    artworkUrl: artworkFor(raw),
    imported: true,
  };

  try {
    registerExternalTrack(track);
    persistLink(track.id, source);
  } catch {
    // The track still works for this session if the local database is unavailable.
  }
  return track;
}

function persistLink(trackId: string, source: TrackSource): void {
  try {
    saveTrackLink(trackId, source);
  } catch {
    // Persistence is best-effort.
  }
}

function persistTrack(track: Track): void {
  try {
    saveExternalTrack(track, Date.now());
  } catch {
    // Persistence is best-effort.
  }
}

export async function searchAudiusTracks(
  query: string,
  signal?: AbortSignal,
): Promise<Track[]> {
  const trimmed = query.trim();
  if (!trimmed || !isAudiusEnabled()) return [];

  const cached = cache.get(trimmed);
  if (cached && Date.now() - cached.at < CACHE_TTL) {
    return cached.tracks;
  }

  const url = `${BASE_URL}/v1/tracks/search?query=${encodeURIComponent(trimmed)}&app_name=${APP_NAME}&limit=${DEFAULT_LIMIT}`;
  const response = await fetch(url, { signal });
  if (!response.ok) {
    throw new Error(`Audius search failed with ${response.status}`);
  }

  const payload = (await response.json()) as SearchResponse;
  const tracks: Track[] = [];
  const seen = new Set<string>();
  for (const raw of payload.data ?? []) {
    const track = toTrack(raw);
    if (!track || seen.has(track.id)) continue;
    seen.add(track.id);
    persistTrack(track);
    tracks.push(track);
  }

  cache.set(trimmed, { at: Date.now(), tracks });
  if (cache.size > 24) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].at - b[1].at)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  return tracks;
}
