export type ArtworkPalette = {
  id: string;
  from: string;
  via: string;
  to: string;
  accent: string;
  deep: string;
  ink: string;
};

export const artworkPalettes: Record<string, ArtworkPalette> = {
  ember: { id: 'ember', from: '#190B07', via: '#A8361F', to: '#FF9364', accent: '#FFD3A8', deep: '#2B0F0A', ink: '#FFF4EC' },
  acid: { id: 'acid', from: '#0A0F05', via: '#334B0A', to: '#C8F751', accent: '#EAFF9E', deep: '#111806', ink: '#F6FFE0' },
  dusk: { id: 'dusk', from: '#0F0A1D', via: '#382766', to: '#9C8CFF', accent: '#D8D2FF', deep: '#1A1233', ink: '#F4F1FF' },
  ice: { id: 'ice', from: '#060F15', via: '#123B4A', to: '#8FD8FF', accent: '#D8F3FF', deep: '#0B2029', ink: '#ECFAFF' },
  forest: { id: 'forest', from: '#06110B', via: '#1D3A27', to: '#9ED6A6', accent: '#D7F2DA', deep: '#0C1F14', ink: '#F0FBF2' },
  mono: { id: 'mono', from: '#08090B', via: '#23272E', to: '#B9C2CF', accent: '#F2F4F8', deep: '#14171C', ink: '#F7F8FA' },
  rose: { id: 'rose', from: '#160810', via: '#5C1F3A', to: '#FF7AA8', accent: '#FFD4E2', deep: '#260F1B', ink: '#FFF1F6' },
  ocean: { id: 'ocean', from: '#040C17', via: '#12335C', to: '#6FA8FF', accent: '#D3E5FF', deep: '#0A1B30', ink: '#EFF6FF' },
  iris: { id: 'iris', from: '#0A0917', via: '#2D2560', to: '#8B7CFF', accent: '#DAD4FF', deep: '#151130', ink: '#F5F2FF' },
  sand: { id: 'sand', from: '#130E06', via: '#4A3A1B', to: '#FFD08A', accent: '#FFF0D2', deep: '#251D0F', ink: '#FFF9EF' },
  clay: { id: 'clay', from: '#110B07', via: '#43291A', to: '#E0A06A', accent: '#F7DDC8', deep: '#241710', ink: '#FDF3EB' },
  mint: { id: 'mint', from: '#05110E', via: '#144237', to: '#7FE0C0', accent: '#D1F8EC', deep: '#0C241F', ink: '#EFFFF9' },
  sunset: { id: 'sunset', from: '#160A04', via: '#6B2E0A', to: '#FFB84D', accent: '#FFE0AC', deep: '#2A150A', ink: '#FFF7EA' },
};

const paletteKeys = Object.keys(artworkPalettes);

export function paletteFor(seed: string, name?: string): ArtworkPalette {
  if (name && artworkPalettes[name]) return artworkPalettes[name];
  let hash = 2166136261;
  for (let i = 0; i < seed.length; i += 1) {
    hash ^= seed.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return artworkPalettes[paletteKeys[(hash >>> 0) % paletteKeys.length]];
}

export function numericSeed(seed: string): number {
  let hash = 5381;
  for (let i = 0; i < seed.length; i += 1) {
    hash = (hash * 33) ^ seed.charCodeAt(i);
  }
  return Math.abs(hash);
}
