import type { AudioStatus } from 'expo-audio';
import { create } from 'zustand';

import { getPlayableSource, getStreamUrl, getTrackById } from '@/data/catalog';
import { DEVICE_SCOPE, getSetting, setSetting } from '@/db/settings';
import { createId } from '@/lib/ids';
import {
  clearLockScreen,
  configureAudioMode,
  loadTrack,
  pause as pauseAudio,
  play as playAudio,
  seekTo,
  subscribeStatus,
  updateLockScreen,
} from '@/services/audio/engine';
import { useLibraryStore } from '@/stores/libraryStore';
import type { RepeatMode, Track } from '@/types';

export type QueueEntry = {
  key: string;
  trackId: string;
};

type PlayerState = {
  queue: QueueEntry[];
  order: number[];
  orderPosition: number;
  currentTrackId: string | null;
  context: string;
  isPlaying: boolean;
  isBuffering: boolean;
  isLoading: boolean;
  positionSec: number;
  durationSec: number;
  repeat: RepeatMode;
  shuffle: boolean;
  error: string | null;
  notice: string | null;
  hydrated: boolean;

  hydrate: () => void;
  playTracks: (
    trackIds: string[],
    options?: { startIndex?: number; context?: string; shuffle?: boolean },
  ) => void;
  playTrack: (trackId: string, context?: string) => void;
  playFromQueue: (queueIndex: number) => void;
  toggle: () => void;
  pause: () => void;
  resume: () => void;
  next: () => void;
  previous: () => void;
  seek: (seconds: number) => void;
  cycleRepeat: () => void;
  setRepeat: (mode: RepeatMode) => void;
  toggleShuffle: () => void;
  addToQueue: (trackIds: string[]) => void;
  playNext: (trackIds: string[]) => void;
  removeFromQueue: (entryKey: string) => void;
  clearQueue: () => void;
  dismissError: () => void;
  dismissNotice: () => void;
};

type Snapshot = {
  trackIds: string[];
  order: number[];
  orderPosition: number;
  repeat: RepeatMode;
  shuffle: boolean;
  context: string;
  positionSec: number;
};

const SNAPSHOT_KEY = 'player.snapshot';

let statusSubscribed = false;
let eventId: string | null = null;
let finishedHandled = false;
let pendingSeek: number | null = null;
let lastTrackId: string | null = null;
let errorTimer: ReturnType<typeof setTimeout> | null = null;
let noticeTimer: ReturnType<typeof setTimeout> | null = null;

function shuffleArray<T>(items: T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function makeEntries(trackIds: string[]): QueueEntry[] {
  return trackIds.map((trackId) => ({ key: createId(), trackId }));
}

function playableTrack(trackId: string): { track: Track; url: string } | null {
  const track = getTrackById(trackId);
  if (!track) return null;
  const source = getPlayableSource(track);
  const url = source ? getStreamUrl(source) : null;
  if (!source || !url) return null;
  return { track, url };
}

function persistSnapshot(state: PlayerState): void {
  if (state.queue.length === 0) {
    setSetting(DEVICE_SCOPE, SNAPSHOT_KEY, '');
    return;
  }
  try {
    const snapshot: Snapshot = {
      trackIds: state.queue.map((entry) => entry.trackId),
      order: state.order,
      orderPosition: state.orderPosition,
      repeat: state.repeat,
      shuffle: state.shuffle,
      context: state.context,
      positionSec: Math.round(state.positionSec),
    };
    setSetting(DEVICE_SCOPE, SNAPSHOT_KEY, JSON.stringify(snapshot));
  } catch {
    // Persistence is best-effort.
  }
}

export const usePlayerStore = create<PlayerState>()((set, get) => {
  function notifyError(message: string): void {
    if (errorTimer) clearTimeout(errorTimer);
    set({ error: message });
    errorTimer = setTimeout(() => set({ error: null }), 4200);
  }

  function notifyNotice(message: string): void {
    if (noticeTimer) clearTimeout(noticeTimer);
    set({ notice: message });
    noticeTimer = setTimeout(() => set({ notice: null }), 4200);
  }

  function finalizeCurrent(reason: 'completed' | 'transition' | 'stop'): void {
    if (!eventId) return;
    const state = get();
    const duration = state.durationSec || 0;
    const played = state.positionSec;
    const completed = reason === 'completed' || (duration > 0 && played >= duration * 0.92);
    const skipped = reason === 'completed' ? false : !completed;
    useLibraryStore.getState().finalizePlayEvent(eventId, {
      secondsPlayed: reason === 'completed' ? duration || played : played,
      completed,
      skipped,
    });
    eventId = null;
  }

  function startCurrent(autoplay: boolean, seekPosition?: number): void {
    const state = get();
    const queueIndex = state.order[state.orderPosition];
    const entry = queueIndex !== undefined ? state.queue[queueIndex] : undefined;
    if (!entry) {
      set({
        currentTrackId: null,
        isPlaying: false,
        isLoading: false,
        isBuffering: false,
      });
      persistSnapshot(get());
      return;
    }
    const playable = playableTrack(entry.trackId);
    if (!playable) {
      const track = getTrackById(entry.trackId);
      const skippedCurrent = lastTrackId === entry.trackId;
      set({ currentTrackId: entry.trackId, isLoading: false, isPlaying: false });
      if (!skippedCurrent && state.order.length > 1) {
        const nextPosition = state.orderPosition + 1;
        if (nextPosition < state.order.length) {
          set({ orderPosition: nextPosition });
          startCurrent(autoplay, seekPosition);
          return;
        }
      }
      notifyError(
        track
          ? `"${track.title}" has no stream available in BOUND.`
          : 'That track is no longer available.',
      );
      return;
    }

    finalizeCurrent('transition');
    lastTrackId = entry.trackId;
    eventId = useLibraryStore.getState().startPlayEvent(entry.trackId, state.context);
    pendingSeek = seekPosition && seekPosition > 0 ? seekPosition : null;
    set({
      currentTrackId: entry.trackId,
      positionSec: pendingSeek ?? 0,
      durationSec: playable.track.durationSec,
      isPlaying: autoplay,
      isLoading: true,
      isBuffering: true,
      error: null,
    });
    configureAudioMode();
    loadTrack(playable.url, autoplay);
    updateLockScreen({
      title: playable.track.title,
      artist: playable.track.artistName,
      albumTitle: playable.track.albumTitle,
    });
    persistSnapshot(get());
  }

  function advance(step: 1 | -1, auto: boolean): void {
    const state = get();
    if (state.order.length === 0) return;
    let nextPosition = state.orderPosition + step;
    if (step === 1 && nextPosition >= state.order.length) {
      if (state.repeat === 'all') {
        nextPosition = 0;
      } else {
        if (auto) {
          finalizeCurrent('completed');
          pauseAudio();
          set({ isPlaying: false, positionSec: state.durationSec });
          persistSnapshot(get());
        }
        return;
      }
    }
    if (step === -1 && nextPosition < 0) {
      if (state.repeat === 'all') {
        nextPosition = state.order.length - 1;
      } else {
        seekTo(0);
        set({ positionSec: 0 });
        return;
      }
    }
    set({ orderPosition: nextPosition });
    startCurrent(true);
  }

  function onStatus(status: AudioStatus): void {
    const state = get();
    if (!status.didJustFinish) finishedHandled = false;
    if (!state.currentTrackId) return;
    const duration = status.duration > 0 ? status.duration : state.durationSec;
    const patch: Partial<PlayerState> = {
      isPlaying: status.playing,
      isBuffering: status.isBuffering,
      isLoading: !status.isLoaded,
      durationSec: duration,
      positionSec: status.currentTime,
    };
    if (pendingSeek !== null && status.isLoaded) {
      const target = pendingSeek;
      pendingSeek = null;
      seekTo(target);
      patch.positionSec = target;
    }
    set(patch);
    if (status.didJustFinish && !finishedHandled) {
      finishedHandled = true;
      const current = get();
      finalizeCurrent('completed');
      if (current.repeat === 'one') {
        seekTo(0);
        set({ positionSec: 0 });
        playAudio();
        set({ isPlaying: true });
        eventId = useLibraryStore
          .getState()
          .startPlayEvent(current.currentTrackId ?? '', current.context);
        return;
      }
      advance(1, true);
    }
  }

  return {
    queue: [],
    order: [],
    orderPosition: 0,
    currentTrackId: null,
    context: '',
    isPlaying: false,
    isBuffering: false,
    isLoading: false,
    positionSec: 0,
    durationSec: 0,
    repeat: 'off',
    shuffle: false,
    error: null,
    notice: null,
    hydrated: false,

    hydrate: () => {
      if (get().hydrated) return;
      configureAudioMode();
      if (!statusSubscribed) {
        subscribeStatus(onStatus);
        statusSubscribed = true;
      }
      let snapshot: Snapshot | null = null;
      try {
        const raw = getSetting(DEVICE_SCOPE, SNAPSHOT_KEY);
        if (raw) snapshot = JSON.parse(raw) as Snapshot;
      } catch {
        snapshot = null;
      }
      if (!snapshot || snapshot.trackIds.length === 0) {
        set({ hydrated: true });
        return;
      }
      const entries = makeEntries(snapshot.trackIds);
      const validIndices = new Set(entries.map((_, index) => index));
      const order = snapshot.order.filter((index) => validIndices.has(index));
      if (order.length === 0) {
        set({ hydrated: true });
        return;
      }
      const orderPosition = Math.min(Math.max(snapshot.orderPosition, 0), order.length - 1);
      set({
        hydrated: true,
        queue: entries,
        order,
        orderPosition,
        repeat: snapshot.repeat ?? 'off',
        shuffle: Boolean(snapshot.shuffle),
        context: snapshot.context ?? '',
      });
      startCurrent(false, snapshot.positionSec);
    },

    playTracks: (trackIds, options) => {
      const requestedStart = options?.startIndex ?? 0;
      const playable: { trackId: string; originalIndex: number }[] = [];
      let skipped = 0;
      trackIds.forEach((trackId, index) => {
        if (playableTrack(trackId)) {
          playable.push({ trackId, originalIndex: index });
        } else {
          skipped += 1;
        }
      });
      if (playable.length === 0) {
        notifyError('None of these tracks can be streamed in BOUND right now.');
        return;
      }
      let startIndex = playable.findIndex((item) => item.originalIndex >= requestedStart);
      if (startIndex === -1) startIndex = 0;
      const entries = makeEntries(playable.map((item) => item.trackId));
      const naturalOrder = entries.map((_, index) => index);
      const shuffle = Boolean(options?.shuffle);
      let order = naturalOrder;
      let orderPosition = startIndex;
      if (shuffle) {
        const rest = naturalOrder.filter((index) => index !== startIndex);
        order = [startIndex, ...shuffleArray(rest)];
        orderPosition = 0;
      }
      finalizeCurrent('transition');
      set({
        queue: entries,
        order,
        orderPosition,
        shuffle,
        context: options?.context ?? '',
        repeat: get().repeat,
      });
      startCurrent(true);
      if (skipped > 0) {
        notifyNotice(
          skipped === 1
            ? '1 track was skipped because it has no stream in BOUND.'
            : `${skipped} tracks were skipped because they have no stream in BOUND.`,
        );
      }
    },

    playTrack: (trackId, context) => {
      get().playTracks([trackId], { context });
    },

    playFromQueue: (queueIndex) => {
      const state = get();
      if (queueIndex < 0 || queueIndex >= state.queue.length) return;
      let order = state.order;
      let orderPosition = order.indexOf(queueIndex);
      if (orderPosition === -1) {
        order = [...order, queueIndex];
        orderPosition = order.length - 1;
      }
      set({ order, orderPosition });
      startCurrent(true);
    },

    toggle: () => {
      if (get().isPlaying) get().pause();
      else get().resume();
    },

    pause: () => {
      pauseAudio();
      set({ isPlaying: false });
      persistSnapshot(get());
    },

    resume: () => {
      const state = get();
      if (!state.currentTrackId) return;
      configureAudioMode();
      playAudio();
      set({ isPlaying: true });
    },

    next: () => advance(1, false),

    previous: () => {
      const state = get();
      if (state.positionSec > 4) {
        seekTo(0);
        set({ positionSec: 0 });
        return;
      }
      advance(-1, false);
    },

    seek: (seconds) => {
      const state = get();
      const clamped = Math.max(0, Math.min(seconds, state.durationSec || seconds));
      set({ positionSec: clamped });
      seekTo(clamped);
    },

    cycleRepeat: () => {
      const state = get();
      const nextMode: RepeatMode =
        state.repeat === 'off' ? 'all' : state.repeat === 'all' ? 'one' : 'off';
      set({ repeat: nextMode });
      persistSnapshot(get());
    },

    setRepeat: (mode) => {
      set({ repeat: mode });
      persistSnapshot(get());
    },

    toggleShuffle: () => {
      const state = get();
      if (state.queue.length === 0) {
        set({ shuffle: !state.shuffle });
        return;
      }
      const currentIndex = state.order[state.orderPosition] ?? 0;
      if (!state.shuffle) {
        const rest = state.queue.map((_, index) => index).filter((index) => index !== currentIndex);
        set({
          shuffle: true,
          order: [currentIndex, ...shuffleArray(rest)],
          orderPosition: 0,
        });
      } else {
        set({
          shuffle: false,
          order: state.queue.map((_, index) => index),
          orderPosition: currentIndex,
        });
      }
      persistSnapshot(get());
    },

    addToQueue: (trackIds) => {
      const state = get();
      const added = makeEntries(trackIds);
      if (added.length === 0) return;
      const baseIndex = state.queue.length;
      const queue = [...state.queue, ...added];
      const order = [...state.order, ...added.map((_, index) => baseIndex + index)];
      set({ queue, order });
      if (!state.currentTrackId) startCurrent(true);
      persistSnapshot(get());
    },

    playNext: (trackIds) => {
      const state = get();
      const added = makeEntries(trackIds);
      if (added.length === 0) return;
      if (!state.currentTrackId) {
        get().addToQueue(trackIds);
        return;
      }
      const currentQueueIndex = state.order[state.orderPosition];
      const insertAt = currentQueueIndex + 1;
      const queue = [
        ...state.queue.slice(0, insertAt),
        ...added,
        ...state.queue.slice(insertAt),
      ];
      const shifted = state.order.map((index) =>
        index >= insertAt ? index + added.length : index,
      );
      const currentOrderPosition = shifted.indexOf(currentQueueIndex);
      const newIndices = added.map((_, index) => insertAt + index);
      shifted.splice(currentOrderPosition + 1, 0, ...newIndices);
      set({ queue, order: shifted });
      persistSnapshot(get());
    },

    removeFromQueue: (entryKey) => {
      const state = get();
      const queueIndex = state.queue.findIndex((entry) => entry.key === entryKey);
      if (queueIndex === -1) return;
      const wasCurrent = state.order[state.orderPosition] === queueIndex;
      const wasPlaying = state.isPlaying;
      const queue = state.queue.filter((_, index) => index !== queueIndex);
      if (queue.length === 0) {
        finalizeCurrent('stop');
        pauseAudio();
        clearLockScreen();
        lastTrackId = null;
        set({
          queue: [],
          order: [],
          orderPosition: 0,
          currentTrackId: null,
          isPlaying: false,
          isLoading: false,
          isBuffering: false,
          positionSec: 0,
          durationSec: 0,
        });
        persistSnapshot(get());
        return;
      }
      const order = state.order
        .filter((index) => index !== queueIndex)
        .map((index) => (index > queueIndex ? index - 1 : index));
      let orderPosition = state.orderPosition;
      if (wasCurrent) {
        orderPosition = Math.min(state.orderPosition, order.length - 1);
        set({ queue, order, orderPosition });
        startCurrent(wasPlaying);
        return;
      }
      if (orderPosition >= order.length) orderPosition = order.length - 1;
      set({ queue, order, orderPosition });
      persistSnapshot(get());
    },

    clearQueue: () => {
      finalizeCurrent('stop');
      pauseAudio();
      clearLockScreen();
      lastTrackId = null;
      set({
        queue: [],
        order: [],
        orderPosition: 0,
        currentTrackId: null,
        isPlaying: false,
        isLoading: false,
        isBuffering: false,
        positionSec: 0,
        durationSec: 0,
        context: '',
      });
      persistSnapshot(get());
    },

    dismissError: () => set({ error: null }),
    dismissNotice: () => set({ notice: null }),
  };
});
