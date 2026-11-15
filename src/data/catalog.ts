import type {
  Album,
  Artist,
  ArtworkSpec,
  ArtworkVariant,
  Genre,
  GenreId,
  MoodId,
  Playlist,
  Track,
  TrackSource,
} from '@/types';

const AUDIO_BASE = 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-';
const AUDIO_DURATIONS = [559, 639, 516, 454, 531, 419, 631, 488, 584, 791, 827, 771, 705, 774, 657, 725];

export const DEMO_AUDIO_CREDIT = 'Demo audio courtesy of SoundHelix';

function demoSource(index: number): TrackSource {
  const n = (index % 16) + 1;
  return {
    provider: 'bound',
    itemId: `soundhelix-${n}`,
    streamUrl: `${AUDIO_BASE}${n}.mp3`,
    externalUrl: 'https://www.soundhelix.com/audio-examples',
    downloadable: true,
    fullLength: true,
    quality: 'MP3 · 128 kbps',
  };
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function makeCanonicalKey(title: string, artist: string): string {
  return `${normalizeText(title)}|${normalizeText(artist)}`;
}

const artwork = (seed: string, variant: ArtworkVariant, palette: string): ArtworkSpec => ({
  seed,
  variant,
  palette,
});

export const genres: Genre[] = [
  {
    id: 'electronic',
    name: 'Electronic',
    blurb: 'Machine soul, modular textures and late-night circuitry.',
    artwork: artwork('electronic', 'wave', 'iris'),
    accent: '#8B7CFF',
    related: ['house', 'techno', 'ambient'],
    featured: true,
  },
  {
    id: 'ambient',
    name: 'Ambient',
    blurb: 'Wide-open soundscapes for deep focus and slower hours.',
    artwork: artwork('ambient', 'bloom', 'ice'),
    accent: '#8FD8FF',
    related: ['classical', 'lofi', 'electronic'],
    featured: true,
  },
  {
    id: 'rnb',
    name: 'R&B',
    blurb: 'Velvet vocals, late-night chords, no wasted motion.',
    artwork: artwork('rnb', 'eclipse', 'ember'),
    accent: '#FF9364',
    related: ['soul', 'hiphop', 'pop'],
    featured: true,
  },
  {
    id: 'hiphop',
    name: 'Hip-Hop',
    blurb: 'Heavy low end, sharp writing, forward motion.',
    artwork: artwork('hiphop', 'bars', 'acid'),
    accent: '#C8F751',
    related: ['rnb', 'afrobeat', 'electronic'],
    featured: true,
  },
  {
    id: 'indie',
    name: 'Indie',
    blurb: 'Bedroom-produced guitars with a cinematic streak.',
    artwork: artwork('indie', 'grid', 'forest'),
    accent: '#9ED6A6',
    related: ['alternative', 'pop', 'rock'],
    featured: true,
  },
  {
    id: 'house',
    name: 'House',
    blurb: 'Four-on-the-floor warmth built for long nights.',
    artwork: artwork('house', 'rings', 'mono'),
    accent: '#D3DAE4',
    related: ['techno', 'electronic', 'afrobeat'],
    featured: true,
  },
  {
    id: 'lofi',
    name: 'Lo-Fi',
    blurb: 'Dusty drums, soft keys, and room to think.',
    artwork: artwork('lofi', 'prism', 'mint'),
    accent: '#7FE0C0',
    related: ['ambient', 'jazz', 'indie'],
  },
  {
    id: 'soul',
    name: 'Soul',
    blurb: 'Live-band heat, honest voices, deep pocket.',
    artwork: artwork('soul', 'bloom', 'clay'),
    accent: '#E0A06A',
    related: ['rnb', 'jazz', 'afrobeat'],
  },
  {
    id: 'alternative',
    name: 'Alternative',
    blurb: 'Guitars that shimmer, distort, and refuse to sit still.',
    artwork: artwork('alternative', 'orbit', 'dusk'),
    accent: '#9C8CFF',
    related: ['indie', 'rock', 'pop'],
  },
  {
    id: 'techno',
    name: 'Techno',
    blurb: 'Hypnotic machinery for the small hours.',
    artwork: artwork('techno', 'bars', 'dusk'),
    accent: '#A8A0C8',
    related: ['house', 'electronic', 'ambient'],
  },
  {
    id: 'pop',
    name: 'Pop',
    blurb: 'Big hooks, bright production, instant recall.',
    artwork: artwork('pop', 'eclipse', 'rose'),
    accent: '#FF9EC4',
    related: ['rnb', 'indie', 'house'],
  },
  {
    id: 'afrobeat',
    name: 'Afrobeat',
    blurb: 'Polyrhythmic sunshine with an unstoppable pulse.',
    artwork: artwork('afrobeat', 'rings', 'sunset'),
    accent: '#FFB84D',
    related: ['soul', 'house', 'hiphop'],
  },
  {
    id: 'jazz',
    name: 'Jazz',
    blurb: 'Conversational players, unhurried arrangements.',
    artwork: artwork('jazz', 'wave', 'sand'),
    accent: '#FFD08A',
    related: ['soul', 'classical', 'lofi'],
  },
  {
    id: 'classical',
    name: 'Modern Classical',
    blurb: 'Piano, strings, and patient harmonic motion.',
    artwork: artwork('classical', 'prism', 'ice'),
    accent: '#A9B8FF',
    related: ['ambient', 'cinematic', 'jazz'],
  },
  {
    id: 'rock',
    name: 'Rock',
    blurb: 'Live drums and amplifiers doing what they do best.',
    artwork: artwork('rock', 'bars', 'ember'),
    accent: '#FF6B5E',
    related: ['alternative', 'indie'],
  },
  {
    id: 'cinematic',
    name: 'Cinematic',
    blurb: 'Score-like scale for widescreen listening.',
    artwork: artwork('cinematic', 'bloom', 'dusk'),
    accent: '#A9B8FF',
    related: ['classical', 'ambient', 'alternative'],
  },
];

type ArtistSeed = Omit<Artist, 'artwork'> & { palette: string; variant: ArtworkVariant };

const artistSeeds: ArtistSeed[] = [
  {
    id: 'sable',
    name: 'Sable',
    genres: ['rnb', 'soul'],
    bio: 'Lisbon-based songwriter Sable makes slow-burning R&B built from close-mic vocals, analogue synths and a rhythm section that never rushes.',
    monthlyListeners: 2_420_000,
    hometown: 'Lisbon, PT',
    verified: true,
    accent: '#FF9364',
    since: 2019,
    palette: 'ember',
    variant: 'eclipse',
  },
  {
    id: 'kairo',
    name: 'Kairo',
    genres: ['hiphop', 'electronic'],
    bio: 'Atlanta producer and rapper Kairo pairs clipped, futuristic beats with writing that reads like a night-shift diary.',
    monthlyListeners: 4_160_000,
    hometown: 'Atlanta, US',
    verified: true,
    accent: '#C8F751',
    since: 2017,
    palette: 'acid',
    variant: 'bars',
  },
  {
    id: 'velvet-static',
    name: 'Velvet Static',
    genres: ['alternative', 'indie'],
    bio: 'Manchester trio Velvet Static bury pop songs under reverb and feedback until they glow.',
    monthlyListeners: 1_240_000,
    hometown: 'Manchester, UK',
    verified: true,
    accent: '#9C8CFF',
    since: 2020,
    palette: 'dusk',
    variant: 'orbit',
  },
  {
    id: 'lumen',
    name: 'Lumen',
    genres: ['ambient', 'classical'],
    bio: 'Reykjavík composer Lumen builds patient, weather-like music from piano, tape loops and room tone.',
    monthlyListeners: 890_000,
    hometown: 'Reykjavík, IS',
    verified: true,
    accent: '#8FD8FF',
    since: 2015,
    palette: 'ice',
    variant: 'bloom',
  },
  {
    id: 'ivy-wren',
    name: 'Ivy Wren',
    genres: ['indie'],
    bio: 'Portland songwriter Ivy Wren writes small, precise folk songs with unusually large rooms around them.',
    monthlyListeners: 640_000,
    hometown: 'Portland, US',
    verified: true,
    accent: '#9ED6A6',
    since: 2021,
    palette: 'forest',
    variant: 'grid',
  },
  {
    id: 'noir-cascade',
    name: 'Noir Cascade',
    genres: ['house', 'techno'],
    bio: 'Berlin’s Noir Cascade makes widescreen club music: tight percussion, vast pads, and a permanent sense of departure.',
    monthlyListeners: 3_280_000,
    hometown: 'Berlin, DE',
    verified: true,
    accent: '#B9C2CF',
    since: 2016,
    palette: 'mono',
    variant: 'rings',
  },
  {
    id: 'mira-sol',
    name: 'Mira Sol',
    genres: ['rnb', 'pop'],
    bio: 'Mexico City’s Mira Sol writes bilingual pop-R&B with a live band looseness and a chorus-first instinct.',
    monthlyListeners: 2_940_000,
    hometown: 'Mexico City, MX',
    verified: true,
    accent: '#FF7AA8',
    since: 2018,
    palette: 'rose',
    variant: 'eclipse',
  },
  {
    id: 'atlas-gray',
    name: 'Atlas Gray',
    genres: ['ambient', 'electronic'],
    bio: 'Oslo producer Atlas Gray turns field recordings and modular drift into slow, magnetic ambient music.',
    monthlyListeners: 1_510_000,
    hometown: 'Oslo, NO',
    verified: true,
    accent: '#6FA8FF',
    since: 2014,
    palette: 'ocean',
    variant: 'bloom',
  },
  {
    id: 'echo-district',
    name: 'Echo District',
    genres: ['electronic', 'techno'],
    bio: 'Seoul’s Echo District makes kinetic electronic music that sits between club and headphones.',
    monthlyListeners: 2_120_000,
    hometown: 'Seoul, KR',
    verified: true,
    accent: '#8B7CFF',
    since: 2019,
    palette: 'iris',
    variant: 'wave',
  },
  {
    id: 'juno-vale',
    name: 'Juno Vale',
    genres: ['pop', 'indie'],
    bio: 'Melbourne’s Juno Vale writes sun-struck pop with sharp edges and a shoegaze heart.',
    monthlyListeners: 1_830_000,
    hometown: 'Melbourne, AU',
    verified: true,
    accent: '#FFD08A',
    since: 2020,
    palette: 'sand',
    variant: 'grid',
  },
  {
    id: 'marlowe',
    name: 'Marlowe',
    genres: ['soul', 'jazz'],
    bio: 'New Orleans bandleader Marlowe makes warm, conversational soul records with a live-room pulse.',
    monthlyListeners: 760_000,
    hometown: 'New Orleans, US',
    verified: true,
    accent: '#E0A06A',
    since: 2013,
    palette: 'clay',
    variant: 'wave',
  },
  {
    id: 'saint-carolina',
    name: 'Saint Carolina',
    genres: ['rock', 'alternative'],
    bio: 'Nashville four-piece Saint Carolina play widescreen rock with country bones and stadium lungs.',
    monthlyListeners: 1_140_000,
    hometown: 'Nashville, US',
    verified: true,
    accent: '#FF6B5E',
    since: 2018,
    palette: 'ember',
    variant: 'bars',
  },
  {
    id: 'tidepool',
    name: 'Tidepool',
    genres: ['lofi', 'ambient'],
    bio: 'Vancouver’s Tidepool makes softly degrading instrumentals for studying, walking, and staring out of windows.',
    monthlyListeners: 2_320_000,
    hometown: 'Vancouver, CA',
    verified: true,
    accent: '#7FE0C0',
    since: 2020,
    palette: 'mint',
    variant: 'prism',
  },
  {
    id: 'night-service',
    name: 'Night Service',
    genres: ['house', 'electronic'],
    bio: 'London duo Night Service make warm, vocal-led house built for the last hour of the night.',
    monthlyListeners: 3_880_000,
    hometown: 'London, UK',
    verified: true,
    accent: '#C8F751',
    since: 2017,
    palette: 'mono',
    variant: 'rings',
  },
  {
    id: 'palace-of-glass',
    name: 'Palace of Glass',
    genres: ['cinematic', 'classical'],
    bio: 'Vienna collective Palace of Glass writes slow-moving instrumental music with a film-score sense of scale.',
    monthlyListeners: 540_000,
    hometown: 'Vienna, AT',
    verified: true,
    accent: '#A9B8FF',
    since: 2012,
    palette: 'ice',
    variant: 'orbit',
  },
  {
    id: 'rue',
    name: 'Rue',
    genres: ['pop', 'electronic'],
    bio: 'Parisian artist Rue makes sleek, bilingual electronic pop with a soft spot for analog imperfection.',
    monthlyListeners: 2_610_000,
    hometown: 'Paris, FR',
    verified: true,
    accent: '#FF9EC4',
    since: 2021,
    palette: 'rose',
    variant: 'prism',
  },
  {
    id: 'mono-lake',
    name: 'Mono Lake',
    genres: ['techno', 'ambient'],
    bio: 'Detroit’s Mono Lake makes spacious, dub-influenced techno that rewards patience.',
    monthlyListeners: 1_420_000,
    hometown: 'Detroit, US',
    verified: true,
    accent: '#8FA1B8',
    since: 2015,
    palette: 'dusk',
    variant: 'rings',
  },
  {
    id: 'elio',
    name: 'Elio',
    genres: ['afrobeat', 'soul'],
    bio: 'Lagos singer-producer Elio makes bright, percussive soul with lyrics about movement, family and home.',
    monthlyListeners: 2_240_000,
    hometown: 'Lagos, NG',
    verified: true,
    accent: '#FFB84D',
    since: 2019,
    palette: 'sunset',
    variant: 'bloom',
  },
];

export const artists: Artist[] = artistSeeds.map(({ palette, variant, ...artist }) => ({
  ...artist,
  artwork: artwork(artist.id, variant, palette),
}));

type AlbumSeed = Omit<Album, 'trackIds' | 'artwork'> & {
  palette: string;
  variant: ArtworkVariant;
  tracks: string[];
  energy: number;
  valence: number;
  tempo: number;
  popularity: number;
  moods: MoodId[];
  explicitTracks?: number[];
};

const albumSeeds: AlbumSeed[] = [
  {
    id: 'afterglow',
    title: 'Afterglow',
    artistId: 'sable',
    genre: 'rnb',
    moods: ['nocturnal', 'romance'],
    releaseDate: '2025-09-12',
    label: 'BOUND Records',
    type: 'album',
    accent: '#FF9364',
    palette: 'ember',
    variant: 'eclipse',
    energy: 0.42,
    valence: 0.52,
    tempo: 82,
    popularity: 91,
    featured: true,
    note: 'Velvet-smooth R&B recorded live to tape in Lisbon.',
    tracks: ['Afterglow', 'Slow Burn', 'Static Bloom', '2AM Gospel'],
    explicitTracks: [3],
  },
  {
    id: 'concrete-choir',
    title: 'Concrete Choir',
    artistId: 'kairo',
    genre: 'hiphop',
    moods: ['nocturnal', 'energy'],
    releaseDate: '2025-11-07',
    label: 'BOUND Records',
    type: 'album',
    accent: '#C8F751',
    palette: 'acid',
    variant: 'bars',
    energy: 0.78,
    valence: 0.44,
    tempo: 138,
    popularity: 94,
    featured: true,
    note: 'A late-night transmission from Atlanta’s future.',
    tracks: ['Concrete Choir', 'Ghost Lanterns', 'Run It Back', 'No Signal'],
    explicitTracks: [1, 2],
  },
  {
    id: 'soft-collapse',
    title: 'Soft Collapse',
    artistId: 'velvet-static',
    genre: 'alternative',
    moods: ['melancholy', 'drive'],
    releaseDate: '2026-02-20',
    label: 'Halo Sound',
    type: 'album',
    accent: '#9C8CFF',
    palette: 'dusk',
    variant: 'orbit',
    energy: 0.64,
    valence: 0.3,
    tempo: 118,
    popularity: 84,
    note: 'Reverb-drenched guitars and pop songs with bruises.',
    tracks: ['Soft Collapse', 'Halo Static', 'Sirens in the Hall', 'Pale Blue Hour'],
  },
  {
    id: 'tidal-memory',
    title: 'Tidal Memory',
    artistId: 'lumen',
    genre: 'ambient',
    moods: ['calm', 'focus'],
    releaseDate: '2024-06-14',
    label: 'Northlight',
    type: 'album',
    accent: '#8FD8FF',
    palette: 'ice',
    variant: 'bloom',
    energy: 0.18,
    valence: 0.58,
    tempo: 64,
    popularity: 79,
    note: 'Piano and tape loops recorded across one Icelandic winter.',
    tracks: ['Tidal Memory', 'Glacier Light', 'Unfolding', 'Return to Stillness'],
  },
  {
    id: 'paper-weather',
    title: 'Paper Weather',
    artistId: 'ivy-wren',
    genre: 'indie',
    moods: ['melancholy', 'calm'],
    releaseDate: '2025-04-03',
    label: 'Field Notes',
    type: 'album',
    accent: '#9ED6A6',
    palette: 'forest',
    variant: 'grid',
    energy: 0.34,
    valence: 0.47,
    tempo: 96,
    popularity: 74,
    tracks: ['Paper Weather', 'Kerosene', 'Marigold', 'Field Notes'],
  },
  {
    id: 'nightform',
    title: 'Nightform',
    artistId: 'noir-cascade',
    genre: 'house',
    moods: ['nocturnal', 'drive'],
    releaseDate: '2026-01-16',
    label: 'Cascade Club',
    type: 'album',
    accent: '#B9C2CF',
    palette: 'mono',
    variant: 'rings',
    energy: 0.82,
    valence: 0.5,
    tempo: 124,
    popularity: 89,
    featured: true,
    note: 'Widescreen club music for the walk home.',
    tracks: ['Nightform', 'Vanth', 'Glass Corridor', 'After the Club'],
  },
  {
    id: 'cielo-rojo',
    title: 'Cielo Rojo',
    artistId: 'mira-sol',
    genre: 'rnb',
    moods: ['romance', 'uplift'],
    releaseDate: '2025-07-25',
    label: 'Solar',
    type: 'album',
    accent: '#FF7AA8',
    palette: 'rose',
    variant: 'eclipse',
    energy: 0.56,
    valence: 0.72,
    tempo: 102,
    popularity: 88,
    tracks: ['Cielo Rojo', 'Miel', 'No Me Llames', 'Amanecer'],
  },
  {
    id: 'low-orbit',
    title: 'Low Orbit',
    artistId: 'atlas-gray',
    genre: 'ambient',
    moods: ['calm', 'focus'],
    releaseDate: '2024-10-11',
    label: 'Northlight',
    type: 'album',
    accent: '#6FA8FF',
    palette: 'ocean',
    variant: 'bloom',
    energy: 0.22,
    valence: 0.42,
    tempo: 72,
    popularity: 81,
    tracks: ['Low Orbit', 'Magnetic North', 'Aurora Drift', 'Quiet Signal'],
  },
  {
    id: 'signal-noise',
    title: 'Signal / Noise',
    artistId: 'echo-district',
    genre: 'electronic',
    moods: ['energy', 'nocturnal'],
    releaseDate: '2025-12-05',
    label: 'District',
    type: 'album',
    accent: '#8B7CFF',
    palette: 'iris',
    variant: 'wave',
    energy: 0.88,
    valence: 0.46,
    tempo: 132,
    popularity: 85,
    tracks: ['Signal / Noise', 'Hologram', 'Circuit Rain', 'Dead Channel'],
  },
  {
    id: 'almost-summer',
    title: 'Almost Summer',
    artistId: 'juno-vale',
    genre: 'pop',
    moods: ['uplift', 'drive'],
    releaseDate: '2026-03-06',
    label: 'Sunroom',
    type: 'album',
    accent: '#FFD08A',
    palette: 'sand',
    variant: 'grid',
    energy: 0.71,
    valence: 0.83,
    tempo: 116,
    popularity: 90,
    featured: true,
    tracks: ['Almost Summer', 'Cherry Radio', 'Polaroid', 'Golden Hour'],
  },
  {
    id: 'blue-room',
    title: 'Blue Room Sessions',
    artistId: 'marlowe',
    genre: 'soul',
    moods: ['romance', 'calm'],
    releaseDate: '2024-08-30',
    label: 'Bayou Electric',
    type: 'album',
    accent: '#E0A06A',
    palette: 'clay',
    variant: 'wave',
    energy: 0.38,
    valence: 0.6,
    tempo: 88,
    popularity: 76,
    note: 'One room, one ribbon microphone, one long night.',
    tracks: ['Blue Room', 'Sunday Clothes', 'Old Flame', 'Last Call'],
  },
  {
    id: 'wildfire-season',
    title: 'Wildfire Season',
    artistId: 'saint-carolina',
    genre: 'rock',
    moods: ['drive', 'uplift'],
    releaseDate: '2025-05-16',
    label: 'Broadcast',
    type: 'album',
    accent: '#FF6B5E',
    palette: 'ember',
    variant: 'bars',
    energy: 0.79,
    valence: 0.55,
    tempo: 142,
    popularity: 82,
    tracks: ['Wildfire Season', 'Dust & Chrome', 'The Long Way', 'Ash'],
  },
  {
    id: 'slow-tide',
    title: 'Slow Tide',
    artistId: 'tidepool',
    genre: 'lofi',
    moods: ['focus', 'calm'],
    releaseDate: '2025-10-24',
    label: 'Window Seat',
    type: 'album',
    accent: '#7FE0C0',
    palette: 'mint',
    variant: 'prism',
    energy: 0.28,
    valence: 0.63,
    tempo: 78,
    popularity: 86,
    tracks: ['Slow Tide', 'Midnight Study', 'Window Seat', 'Lavender Steam'],
  },
  {
    id: 'open-late',
    title: 'Open Late',
    artistId: 'night-service',
    genre: 'house',
    moods: ['nocturnal', 'romance'],
    releaseDate: '2026-04-10',
    label: 'Service Recordings',
    type: 'album',
    accent: '#C8F751',
    palette: 'mono',
    variant: 'rings',
    energy: 0.76,
    valence: 0.66,
    tempo: 122,
    popularity: 92,
    featured: true,
    tracks: ['Open Late', 'Backroom', 'Need You There', 'Last Train Home'],
  },
  {
    id: 'cathedrals',
    title: 'Cathedrals',
    artistId: 'palace-of-glass',
    genre: 'cinematic',
    moods: ['melancholy', 'focus'],
    releaseDate: '2024-03-22',
    label: 'Northlight',
    type: 'album',
    accent: '#A9B8FF',
    palette: 'ice',
    variant: 'orbit',
    energy: 0.3,
    valence: 0.36,
    tempo: 68,
    popularity: 72,
    tracks: ['Cathedrals', 'Glass Requiem', 'Ascend', 'Tomorrow, in Amber'],
  },
  {
    id: 'coeur-leger',
    title: 'Cœur Léger',
    artistId: 'rue',
    genre: 'pop',
    moods: ['uplift', 'romance'],
    releaseDate: '2025-06-06',
    label: 'Rive Gauche',
    type: 'album',
    accent: '#FF9EC4',
    palette: 'rose',
    variant: 'prism',
    energy: 0.63,
    valence: 0.78,
    tempo: 108,
    popularity: 87,
    tracks: ['Cœur Léger', 'Exil', 'Rue de Nuit', 'Pendant que tu dors'],
  },
  {
    id: 'deep-field',
    title: 'Deep Field',
    artistId: 'mono-lake',
    genre: 'techno',
    moods: ['nocturnal', 'focus'],
    releaseDate: '2026-05-01',
    label: 'Lakebed',
    type: 'album',
    accent: '#8FA1B8',
    palette: 'dusk',
    variant: 'rings',
    energy: 0.84,
    valence: 0.34,
    tempo: 130,
    popularity: 78,
    tracks: ['Deep Field', 'Pressure', 'Pulse Theory', 'Submerge'],
  },
  {
    id: 'sun-machine',
    title: 'Sun Machine',
    artistId: 'elio',
    genre: 'afrobeat',
    moods: ['uplift', 'energy'],
    releaseDate: '2025-08-15',
    label: 'BOUND Records',
    type: 'album',
    accent: '#FFB84D',
    palette: 'sunset',
    variant: 'bloom',
    energy: 0.75,
    valence: 0.85,
    tempo: 110,
    popularity: 93,
    featured: true,
    note: 'Percussion-forward soul with the windows rolled down.',
    tracks: ['Sun Machine', 'Lagos Night', 'Amaka', 'Carry Me'],
  },
];

let audioCursor = 0;

export const albums: Album[] = albumSeeds.map(
  ({ palette, variant, tracks, energy, valence, tempo, popularity, moods, explicitTracks, ...album }) => ({
    ...album,
    artwork: artwork(album.id, variant, palette),
    moods,
    trackIds: tracks.map((_, index) => `${album.id}-t${index + 1}`),
  })
);

const albumSeedMap = new Map(albumSeeds.map((seed) => [seed.id, seed]));

export const tracks: Track[] = albums.flatMap((album) => {
  const seed = albumSeedMap.get(album.id)!;
  const artist = artists.find((entry) => entry.id === album.artistId)!;
  return album.trackIds.map((trackId, index) => {
    const audioIndex = audioCursor;
    audioCursor += 1;
    const title = seed.tracks[index];
    const durationSec = AUDIO_DURATIONS[audioIndex % AUDIO_DURATIONS.length];
    const popularity = Math.max(
      28,
      Math.min(99, seed.popularity - index * 4 + ((audioIndex * 7) % 6))
    );
    return {
      id: trackId,
      title,
      artistId: artist.id,
      artistName: artist.name,
      albumId: album.id,
      albumTitle: album.title,
      durationSec,
      genre: album.genre,
      moods: seed.moods,
      energy: Math.max(0.08, Math.min(0.98, seed.energy + (index - 1.5) * 0.03)),
      valence: Math.max(0.08, Math.min(0.98, seed.valence + (index % 2 === 0 ? 0.02 : -0.02))),
      tempo: seed.tempo + (index % 3) * 2,
      releaseDate: seed.releaseDate,
      explicit: seed.explicitTracks?.includes(index) ?? false,
      popularity,
      canonicalKey: makeCanonicalKey(title, artist.name),
      sources: [demoSource(audioIndex)],
      artwork: album.artwork,
      featured: album.featured && index === 0,
    } satisfies Track;
  });
});

export const tracksById = new Map(tracks.map((track) => [track.id, track]));
export const artistsById = new Map(artists.map((artist) => [artist.id, artist]));
export const albumsById = new Map(albums.map((album) => [album.id, album]));
export const genresById = new Map(genres.map((genre) => [genre.id, genre]));

export const tracksByArtist = new Map<string, Track[]>();
export const tracksByAlbum = new Map<string, Track[]>();
export const albumsByArtist = new Map<string, Album[]>();
export const tracksByGenre = new Map<GenreId, Track[]>();
export const tracksByCanonicalKey = new Map<string, Track>();

for (const track of tracks) {
  if (track.artistId) {
    const list = tracksByArtist.get(track.artistId) ?? [];
    list.push(track);
    tracksByArtist.set(track.artistId, list);
  }
  if (track.albumId) {
    const list = tracksByAlbum.get(track.albumId) ?? [];
    list.push(track);
    tracksByAlbum.set(track.albumId, list);
  }
  const genreList = tracksByGenre.get(track.genre) ?? [];
  genreList.push(track);
  tracksByGenre.set(track.genre, genreList);
  tracksByCanonicalKey.set(track.canonicalKey, track);
}

for (const album of albums) {
  const list = albumsByArtist.get(album.artistId) ?? [];
  list.push(album);
  albumsByArtist.set(album.artistId, list);
}

type PlaylistSeed = {
  id: string;
  title: string;
  description: string;
  palette: string;
  variant: ArtworkVariant;
  accent: string;
  curator: string;
  genres: GenreId[];
  moods: MoodId[];
  count: number;
  seed: number;
  featured?: boolean;
};

const playlistSeeds: PlaylistSeed[] = [
  {
    id: 'bound-edit',
    title: 'The BOUND Edit',
    description: 'The records our editors cannot stop playing. Refreshed every Friday.',
    palette: 'acid',
    variant: 'orbit',
    accent: '#C8F751',
    curator: 'BOUND Editorial',
    genres: ['rnb', 'hiphop', 'electronic', 'afrobeat', 'house', 'pop'],
    moods: ['uplift', 'nocturnal', 'energy'],
    count: 18,
    seed: 11,
    featured: true,
  },
  {
    id: 'after-hours',
    title: 'After Hours',
    description: 'Low light, slow motion. For the hours after the city goes quiet.',
    palette: 'ember',
    variant: 'eclipse',
    accent: '#FF9364',
    curator: 'BOUND Editorial',
    genres: ['rnb', 'soul', 'house'],
    moods: ['nocturnal', 'romance'],
    count: 16,
    seed: 23,
    featured: true,
  },
  {
    id: 'neon-drift',
    title: 'Neon Drift',
    description: 'Club-adjacent electronics for long walks and longer drives.',
    palette: 'iris',
    variant: 'wave',
    accent: '#8B7CFF',
    curator: 'BOUND Editorial',
    genres: ['electronic', 'house', 'techno'],
    moods: ['drive', 'nocturnal', 'energy'],
    count: 18,
    seed: 37,
    featured: true,
  },
  {
    id: 'soft-focus',
    title: 'Soft Focus',
    description: 'Ambient, modern classical and everything that breathes slowly.',
    palette: 'ice',
    variant: 'bloom',
    accent: '#8FD8FF',
    curator: 'BOUND Editorial',
    genres: ['ambient', 'classical', 'cinematic'],
    moods: ['calm', 'focus'],
    count: 16,
    seed: 41,
  },
  {
    id: 'golden-hour',
    title: 'Golden Hour',
    description: 'Warm guitars, brighter choruses, and the last light of the day.',
    palette: 'sand',
    variant: 'grid',
    accent: '#FFD08A',
    curator: 'BOUND Editorial',
    genres: ['indie', 'pop', 'alternative'],
    moods: ['uplift', 'romance'],
    count: 16,
    seed: 53,
  },
  {
    id: 'low-end-theory',
    title: 'Low End Theory',
    description: 'Sub-heavy selections from hip-hop, R&B and Afrobeat.',
    palette: 'acid',
    variant: 'bars',
    accent: '#C8F751',
    curator: 'BOUND Editorial',
    genres: ['hiphop', 'rnb', 'afrobeat'],
    moods: ['energy', 'drive'],
    count: 16,
    seed: 67,
  },
  {
    id: 'deep-work',
    title: 'Deep Work',
    description: 'Instrumental focus music with no sharp edges.',
    palette: 'mint',
    variant: 'prism',
    accent: '#7FE0C0',
    curator: 'BOUND Editorial',
    genres: ['ambient', 'lofi', 'classical'],
    moods: ['focus', 'calm'],
    count: 18,
    seed: 71,
  },
  {
    id: 'sunday-slowdown',
    title: 'Sunday Slowdown',
    description: 'Soul, jazz and soft-focus indie for doing absolutely nothing.',
    palette: 'clay',
    variant: 'wave',
    accent: '#E0A06A',
    curator: 'BOUND Editorial',
    genres: ['soul', 'jazz', 'indie'],
    moods: ['calm', 'romance'],
    count: 14,
    seed: 83,
  },
  {
    id: 'rooftop-radio',
    title: 'Rooftop Radio',
    description: 'House, pop and electronics with the windows open.',
    palette: 'sunset',
    variant: 'rings',
    accent: '#FFB84D',
    curator: 'BOUND Editorial',
    genres: ['house', 'pop', 'electronic', 'afrobeat'],
    moods: ['uplift', 'drive'],
    count: 16,
    seed: 97,
  },
  {
    id: 'nocturne',
    title: 'Nocturne',
    description: 'Cinematic, weightless music for the small hours.',
    palette: 'dusk',
    variant: 'orbit',
    accent: '#9C8CFF',
    curator: 'BOUND Editorial',
    genres: ['ambient', 'techno', 'cinematic', 'classical'],
    moods: ['nocturnal', 'melancholy'],
    count: 14,
    seed: 101,
  },
];

function hashString(value: string): number {
  let hash = 2166136261;
  for (let i = 0; i < value.length; i += 1) {
    hash ^= value.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function seededOrder<T>(items: T[], seed: number): T[] {
  return [...items]
    .map((item, index) => ({ item, value: ((hashString(`${seed}-${index}`) % 1000) / 1000) }))
    .sort((a, b) => a.value - b.value)
    .map((entry) => entry.item);
}

function buildPlaylistTracks(seed: PlaylistSeed): string[] {
  const matched = tracks.filter(
    (track) => seed.genres.includes(track.genre) && track.moods.some((mood) => seed.moods.includes(mood))
  );
  const fallback = tracks.filter((track) => seed.genres.includes(track.genre));
  const pool = matched.length >= seed.count ? matched : [...new Set([...matched, ...fallback])];
  const picked = seededOrder(pool, seed.seed).slice(0, seed.count);
  const albumArtists = new Set<string>();
  const balanced: Track[] = [];
  const overflow: Track[] = [];
  for (const track of picked) {
    if (track.artistName && albumArtists.has(track.artistName)) overflow.push(track);
    else {
      albumArtists.add(track.artistName);
      balanced.push(track);
    }
  }
  return [...balanced, ...overflow].slice(0, seed.count).map((track) => track.id);
}

const curatedCreatedAt = Date.parse('2026-01-01T00:00:00.000Z');

export const curatedPlaylists: Playlist[] = playlistSeeds.map((seed) => ({
  id: seed.id,
  title: seed.title,
  description: seed.description,
  trackIds: buildPlaylistTracks(seed),
  artwork: artwork(seed.id, seed.variant, seed.palette),
  accent: seed.accent,
  curator: seed.curator,
  isSystem: true,
  isCurated: true,
  createdAt: curatedCreatedAt,
  updatedAt: curatedCreatedAt,
}));

export const playlistsById = new Map(curatedPlaylists.map((playlist) => [playlist.id, playlist]));

const externalTracksById = new Map<string, Track>();
const externalTracksByKey = new Map<string, Track>();
const trackLinks = new Map<string, TrackSource[]>();
const localTrackSources = new Map<string, TrackSource>();

export function setLocalTrackSource(trackId: string, source: TrackSource | null): void {
  if (source) {
    localTrackSources.set(trackId, source);
  } else {
    localTrackSources.delete(trackId);
  }
}

export function registerTrackSources(trackId: string, sources: TrackSource[]): void {
  const existing = new Set((trackLinks.get(trackId) ?? []).map((source) => `${source.provider}:${source.itemId}`));
  const merged = [...(trackLinks.get(trackId) ?? [])];
  for (const source of sources) {
    const key = `${source.provider}:${source.itemId}`;
    if (!existing.has(key)) {
      merged.push(source);
      existing.add(key);
    }
  }
  trackLinks.set(trackId, merged);
}

export function registerExternalTrack(track: Track): void {
  if (tracksById.has(track.id)) return;
  externalTracksById.set(track.id, track);
  if (!externalTracksByKey.has(track.canonicalKey)) {
    externalTracksByKey.set(track.canonicalKey, track);
  }
}

export function findTrackByCanonicalKey(key: string): Track | undefined {
  return tracksByCanonicalKey.get(key) ?? externalTracksByKey.get(key);
}

export function resolveTrackSources(track: Track): TrackSource[] {
  const local = localTrackSources.get(track.id);
  const linked = trackLinks.get(track.id);
  const base = local ? [local, ...track.sources] : track.sources;
  if (!linked?.length) return base;
  const seen = new Set(base.map((source) => `${source.provider}:${source.itemId}`));
  return [...base, ...linked.filter((source) => !seen.has(`${source.provider}:${source.itemId}`))];
}

export function getPlayableSource(track: Track): TrackSource | null {
  const sources = resolveTrackSources(track);
  return (
    sources.find((source) => source.fullLength && Boolean(source.streamUrl)) ??
    sources.find((source) => Boolean(source.streamUrl)) ??
    sources.find((source) => Boolean(source.previewUrl)) ??
    null
  );
}

export function getStreamUrl(source: TrackSource): string | null {
  return source.streamUrl ?? source.previewUrl ?? null;
}

export function getTrackById(id: string): Track | undefined {
  return tracksById.get(id) ?? externalTracksById.get(id);
}

export function getAllTracks(): Track[] {
  return [...tracks, ...externalTracksById.values()];
}

export function getExternalTracks(): Track[] {
  return [...externalTracksById.values()];
}

export function resetExternalCatalog(): void {
  externalTracksById.clear();
  externalTracksByKey.clear();
  trackLinks.clear();
  localTrackSources.clear();
}

export function getArtistById(id?: string): Artist | undefined {
  return id ? artistsById.get(id) : undefined;
}

export function getAlbumById(id?: string): Album | undefined {
  return id ? albumsById.get(id) : undefined;
}

export function getPlaylistById(id: string): Playlist | undefined {
  return playlistsById.get(id);
}

export function getGenreById(id: string): Genre | undefined {
  return genresById.get(id as GenreId);
}

export function getTracksByIds(ids: string[]): Track[] {
  return ids.map((id) => getTrackById(id)).filter((track): track is Track => Boolean(track));
}

export function getAlbumTracks(albumId: string): Track[] {
  return tracksByAlbum.get(albumId) ?? [];
}

export function getArtistTracks(artistId: string): Track[] {
  return tracksByArtist.get(artistId) ?? [];
}

export function getArtistAlbums(artistId: string): Album[] {
  return (albumsByArtist.get(artistId) ?? []).sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
}

export const popularTracks = [...tracks].sort((a, b) => b.popularity - a.popularity);
export const newReleases = [...albums].sort((a, b) => b.releaseDate.localeCompare(a.releaseDate));
export const popularArtists = [...artists].sort((a, b) => b.monthlyListeners - a.monthlyListeners);
