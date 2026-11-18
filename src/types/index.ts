export type GenreId =
  | 'alternative'
  | 'electronic'
  | 'rnb'
  | 'hiphop'
  | 'indie'
  | 'ambient'
  | 'pop'
  | 'jazz'
  | 'soul'
  | 'house'
  | 'techno'
  | 'lofi'
  | 'rock'
  | 'afrobeat'
  | 'classical'
  | 'cinematic';

export type MoodId =
  | 'nocturnal'
  | 'focus'
  | 'uplift'
  | 'melancholy'
  | 'drive'
  | 'romance'
  | 'energy'
  | 'calm';

export type SourceId =
  | 'bound'
  | 'local'
  | 'audius'
  | 'spotify'
  | 'soundcloud'
  | 'appleMusic'
  | 'youtubeMusic'
  | 'deezer';

export type ProviderId = Exclude<SourceId, 'bound' | 'local'>;

export type ArtworkVariant =
  | 'orbit'
  | 'wave'
  | 'grid'
  | 'bloom'
  | 'prism'
  | 'bars'
  | 'eclipse'
  | 'rings';

export type ArtworkSpec = {
  seed: string;
  variant: ArtworkVariant;
  palette?: string;
};

export type TrackSource = {
  provider: SourceId;
  itemId: string;
  streamUrl?: string;
  previewUrl?: string;
  externalUrl?: string;
  downloadable: boolean;
  fullLength: boolean;
  quality?: string;
};

export type Track = {
  id: string;
  title: string;
  artistId?: string;
  artistName: string;
  albumId?: string;
  albumTitle?: string;
  durationSec: number;
  genre: GenreId;
  moods: MoodId[];
  energy: number;
  valence: number;
  tempo: number;
  releaseDate: string;
  explicit: boolean;
  popularity: number;
  isrc?: string;
  canonicalKey: string;
  sources: TrackSource[];
  artwork?: ArtworkSpec;
  artworkUrl?: string;
  imported?: boolean;
  featured?: boolean;
};

export type Artist = {
  id: string;
  name: string;
  genres: GenreId[];
  bio: string;
  monthlyListeners: number;
  hometown: string;
  verified: boolean;
  artwork: ArtworkSpec;
  accent: string;
  since: number;
};

export type Album = {
  id: string;
  title: string;
  artistId: string;
  genre: GenreId;
  moods: MoodId[];
  releaseDate: string;
  trackIds: string[];
  label: string;
  type: 'album' | 'ep' | 'single' | 'mixtape';
  artwork: ArtworkSpec;
  accent: string;
  note?: string;
  featured?: boolean;
};

export type Playlist = {
  id: string;
  title: string;
  description: string;
  trackIds: string[];
  artwork: ArtworkSpec;
  accent: string;
  curator: string;
  isSystem: boolean;
  isCurated?: boolean;
  createdAt: number;
  updatedAt: number;
};

export type Genre = {
  id: GenreId;
  name: string;
  blurb: string;
  artwork: ArtworkSpec;
  accent: string;
  related: GenreId[];
  featured?: boolean;
};

export type PlayEvent = {
  id: string;
  trackId: string;
  playedAt: number;
  secondsPlayed: number;
  completed: boolean;
  skipped: boolean;
  context: string;
};

export type DownloadStatus = 'queued' | 'downloading' | 'paused' | 'completed' | 'failed';

export type DownloadRecord = {
  trackId: string;
  status: DownloadStatus;
  progress: number;
  fileUri?: string;
  bytes: number;
  quality: 'standard' | 'high';
  createdAt: number;
  updatedAt: number;
  error?: string;
};

export type ConversionFormat = 'mp3' | 'wav' | 'flac' | 'aac' | 'm4a' | 'ogg' | 'opus';

export type ConversionRecord = {
  id: string;
  inputName: string;
  outputName: string;
  outputUri: string;
  format: ConversionFormat;
  bitrateKbps: number;
  sampleRate: number;
  status: 'processing' | 'completed' | 'failed';
  sizeBytes: number;
  createdAt: number;
  error?: string;
};

export type AccountKind = 'member' | 'guest';

export type Account = {
  id: string;
  kind: AccountKind;
  email: string | null;
  displayName: string;
  accent: string;
  avatarSeed: string;
  createdAt: number;
  updatedAt: number;
};

export type PlaybackMode = 'normal' | 'repeat-all' | 'repeat-one';

export type RepeatMode = 'off' | 'all' | 'one';

export type SortField = 'recent' | 'title' | 'artist' | 'duration' | 'added';

export type LibraryFilter = 'all' | 'playlists' | 'albums' | 'artists' | 'liked';

export type ProviderCapabilities = {
  search: boolean;
  importLibrary: boolean;
  importPlaylists: boolean;
  fullStream: boolean;
  previewStream: boolean;
  downloadable: boolean;
  requiresBackend: boolean;
};

export type ProviderTrack = {
  provider: ProviderId;
  providerTrackId: string;
  title: string;
  artistName: string;
  artistProviderId?: string;
  albumTitle?: string;
  albumProviderId?: string;
  durationSec: number;
  artworkUrl?: string;
  externalUrl: string;
  previewUrl?: string;
  isrc?: string;
  releaseDate?: string;
  genre?: string;
};

export type ProviderPlaylist = {
  provider: ProviderId;
  providerPlaylistId: string;
  title: string;
  description: string;
  artworkUrl?: string;
  externalUrl: string;
  trackCount: number;
  tracks: ProviderTrack[];
};

export type ProviderConnection = {
  provider: ProviderId;
  providerUserId: string;
  displayName: string;
  connectedAt: number;
  scopes?: string;
};

export type ProviderSearchResult = {
  provider: ProviderId;
  tracks: ProviderTrack[];
  playlists: ProviderPlaylist[];
};

export type ProviderDefinition = {
  id: ProviderId;
  name: string;
  tagline: string;
  color: string;
  capabilities: ProviderCapabilities;
  setupNote: string;
  docsUrl?: string;
  isConfigured: () => boolean;
};

export type ImportedTrackRow = {
  trackId: string;
  provider: ProviderId;
  importedAt: number;
};

export type SearchResults = {
  tracks: Track[];
  artists: Artist[];
  albums: Album[];
  playlists: Playlist[];
  genres: Genre[];
};

export type RadioStation = {
  id: string;
  title: string;
  description: string;
  trackIds: string[];
  artwork: ArtworkSpec;
  accent: string;
};
