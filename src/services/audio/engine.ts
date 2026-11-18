import { createAudioPlayer, setAudioModeAsync } from 'expo-audio';
import type { AudioMetadata, AudioPlayer, AudioStatus } from 'expo-audio';
import { Platform } from 'react-native';

type StatusListener = (status: AudioStatus) => void;

let player: AudioPlayer | null = null;
let subscription: { remove: () => void } | null = null;
let listeners = new Set<StatusListener>();
let latest: AudioStatus | null = null;
let modeConfigured = false;
let lockScreenEnabled = true;
let backgroundEnabled = true;

function ensurePlayer(): AudioPlayer {
  if (!player) {
    player = createAudioPlayer(null, { updateInterval: 500 });
    subscription = player.addListener('playbackStatusUpdate', (status) => {
      latest = status;
      listeners.forEach((listener) => listener(status));
    });
  }
  return player;
}

export async function configureAudioMode(): Promise<void> {
  if (modeConfigured) return;
  try {
    await setAudioModeAsync({
      playsInSilentMode: true,
      shouldPlayInBackground: backgroundEnabled,
      interruptionMode: 'doNotMix',
      allowsRecording: false,
      shouldRouteThroughEarpiece: false,
    });
    modeConfigured = true;
  } catch {
    // Audio mode configuration is best-effort; playback still works without it.
  }
}

export function setBackgroundPreference(enabled: boolean): void {
  backgroundEnabled = enabled;
  modeConfigured = false;
  configureAudioMode();
}

export function setLockScreenPreference(enabled: boolean): void {
  lockScreenEnabled = enabled;
  if (!enabled) {
    clearLockScreen();
  }
}

export function subscribeStatus(listener: StatusListener): () => void {
  ensurePlayer();
  listeners.add(listener);
  if (latest) listener(latest);
  return () => {
    listeners.delete(listener);
  };
}

export function loadTrack(url: string, autoplay: boolean): void {
  const audio = ensurePlayer();
  audio.replace({ uri: url });
  if (autoplay) {
    audio.play();
  }
}

export function play(): void {
  ensurePlayer().play();
}

export function pause(): void {
  ensurePlayer().pause();
}

export function seekTo(seconds: number): Promise<void> {
  return ensurePlayer().seekTo(seconds).catch(() => undefined);
}

export function setVolume(value: number): void {
  ensurePlayer().volume = Math.max(0, Math.min(1, value));
}

export function setLoop(loop: boolean): void {
  ensurePlayer().loop = loop;
}

export function updateLockScreen(metadata: AudioMetadata): void {
  if (Platform.OS === 'web' || !lockScreenEnabled) return;
  try {
    ensurePlayer().setActiveForLockScreen(true, metadata, {
      showSeekBackward: true,
      showSeekForward: true,
    });
  } catch {
    // Lock screen controls are optional.
  }
}

export function clearLockScreen(): void {
  if (Platform.OS === 'web') return;
  try {
    player?.clearLockScreenControls();
  } catch {
    // Ignore.
  }
}

export function disposePlayer(): void {
  subscription?.remove();
  subscription = null;
  listeners = new Set();
  latest = null;
  player?.remove();
  player = null;
  modeConfigured = false;
}
