import { create } from 'zustand';

type TrackMenuState = {
  trackId: string | null;
  playlistId: string | null;
  open: (trackId: string, playlistId?: string) => void;
  close: () => void;
};

export const useTrackMenuStore = create<TrackMenuState>()((set) => ({
  trackId: null,
  playlistId: null,
  open: (trackId, playlistId) => set({ trackId, playlistId: playlistId ?? null }),
  close: () => set({ trackId: null, playlistId: null }),
}));

export const trackMenu = {
  open: (trackId: string, playlistId?: string) =>
    useTrackMenuStore.getState().open(trackId, playlistId),
  close: () => useTrackMenuStore.getState().close(),
};
