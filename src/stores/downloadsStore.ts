import { Directory, File, Paths } from 'expo-file-system';
import type { DownloadTask } from 'expo-file-system';
import { Platform } from 'react-native';
import { create } from 'zustand';

import { getStreamUrl, getTrackById, resolveTrackSources, setLocalTrackSource } from '@/data/catalog';
import {
  listDownloads,
  removeDownload,
  updateDownload,
  upsertDownload,
} from '@/db/downloads';
import * as haptics from '@/lib/haptics';
import type { DownloadRecord, TrackSource } from '@/types';

type DownloadsState = {
  accountId: string | null;
  hydrated: boolean;
  records: Record<string, DownloadRecord>;
  hydrate: (accountId: string) => void;
  unload: () => void;
  download: (trackId: string) => Promise<boolean>;
  cancel: (trackId: string) => void;
  remove: (trackId: string) => Promise<void>;
  retry: (trackId: string) => Promise<boolean>;
  clearAll: () => Promise<void>;
};

const tasks = new Map<string, DownloadTask>();
const cancelled = new Set<string>();
const lastPersist = new Map<string, number>();

function extensionFor(url: string): string {
  const clean = url.split('?')[0].split('#')[0];
  const match = clean.match(/\.([a-zA-Z0-9]{2,5})$/);
  const ext = match?.[1]?.toLowerCase();
  if (ext && ['mp3', 'm4a', 'aac', 'wav', 'flac', 'ogg', 'opus'].includes(ext)) return ext;
  return 'mp3';
}

function directoryFor(accountId: string): Directory {
  return new Directory(Paths.document, 'bound-downloads', accountId);
}

function ensureDirectory(accountId: string): Directory {
  const directory = directoryFor(accountId);
  if (!directory.exists) {
    directory.create({ intermediates: true, idempotent: true });
  }
  return directory;
}

function localSource(uri: string, quality: 'standard' | 'high'): TrackSource {
  return {
    provider: 'local',
    itemId: uri,
    streamUrl: uri,
    downloadable: true,
    fullLength: true,
    quality: quality === 'high' ? 'downloaded' : 'downloaded-standard',
  };
}

export const useDownloadsStore = create<DownloadsState>()((set, get) => ({
  accountId: null,
  hydrated: false,
  records: {},

  hydrate: (accountId) => {
    const rows = listDownloads(accountId);
    const records: Record<string, DownloadRecord> = {};
    for (const row of rows) {
      let record = row;
      if (record.status === 'completed' && record.fileUri) {
        if (Platform.OS === 'web') {
          record = { ...record, status: 'failed', error: 'Downloads require the native app.' };
        } else {
          try {
            const file = new File(record.fileUri);
            if (file.exists) {
              setLocalTrackSource(record.trackId, localSource(file.uri, record.quality));
            } else {
              record = { ...record, status: 'failed', error: 'The downloaded file is missing.' };
            }
          } catch {
            record = { ...record, status: 'failed', error: 'The downloaded file is missing.' };
          }
        }
      } else if (record.status === 'downloading' || record.status === 'queued') {
        record = { ...record, status: 'failed', error: 'Download interrupted. Try again.' };
      }
      records[record.trackId] = record;
    }
    set({ accountId, hydrated: true, records });
  },

  unload: () => {
    for (const task of tasks.values()) {
      try {
        task.cancel();
      } catch {
        // Ignore.
      }
    }
    tasks.clear();
    cancelled.clear();
    lastPersist.clear();
    set({ accountId: null, hydrated: false, records: {} });
  },

  download: async (trackId) => {
    const { accountId, records } = get();
    if (!accountId) return false;
    if (tasks.has(trackId)) return false;
    if (records[trackId]?.status === 'completed') return true;
    if (Platform.OS === 'web') {
      const now = Date.now();
      upsertDownload(accountId, {
        trackId,
        status: 'failed',
        progress: 0,
        bytes: 0,
        quality: 'high',
        createdAt: now,
        updatedAt: now,
        error: 'Downloads are available in the native app.',
      });
      set((state) => ({
        records: {
          ...state.records,
          [trackId]: {
            trackId,
            status: 'failed',
            progress: 0,
            bytes: 0,
            quality: 'high',
            createdAt: now,
            updatedAt: now,
            error: 'Downloads are available in the native app.',
          },
        },
      }));
      return false;
    }
    const track = getTrackById(trackId);
    if (!track) return false;
    const source = resolveTrackSources(track).find(
      (item) => item.downloadable && (item.streamUrl || item.previewUrl),
    );
    const url = source ? getStreamUrl(source) : null;
    if (!source || !url) {
      const now = Date.now();
      const record: DownloadRecord = {
        trackId,
        status: 'failed',
        progress: 0,
        bytes: 0,
        quality: 'high',
        createdAt: now,
        updatedAt: now,
        error: 'This track cannot be downloaded.',
      };
      upsertDownload(accountId, record);
      set((state) => ({ records: { ...state.records, [trackId]: record } }));
      return false;
    }

    try {
      warehouseCheck();
      const directory = ensureDirectory(accountId);
      const file = new File(directory, `${trackId}.${extensionFor(url)}`);
      const now = Date.now();
      const initial: DownloadRecord = {
        trackId,
        status: 'downloading',
        progress: 0,
        bytes: 0,
        quality: 'high',
        createdAt: records[trackId]?.createdAt ?? now,
        updatedAt: now,
      };
      upsertDownload(accountId, initial);
      set((state) => ({ records: { ...state.records, [trackId]: initial } }));
      cancelled.delete(trackId);

      const task = File.createDownloadTask(url, file, {
        onProgress: ({ bytesWritten, totalBytes }) => {
          const timestamp = Date.now();
          const progress = totalBytes > 0 ? Math.min(bytesWritten / totalBytes, 0.995) : 0;
          set((state) => {
            const current = state.records[trackId];
            if (!current) return state;
            return {
              records: {
                ...state.records,
                [trackId]: {
                  ...current,
                  status: 'downloading',
                  progress,
                  bytes: bytesWritten,
                  updatedAt: timestamp,
                },
              },
            };
          });
          const last = lastPersist.get(trackId) ?? 0;
          if (timestamp - last > 600) {
            lastPersist.set(trackId, timestamp);
            updateDownload(
              accountId,
              trackId,
              { status: 'downloading', progress, bytes: bytesWritten },
              timestamp,
            );
          }
        },
      });
      tasks.set(trackId, task);
      const result = await task.downloadAsync();
      tasks.delete(trackId);
      lastPersist.delete(trackId);
      if (cancelled.has(trackId)) {
        cancelled.delete(trackId);
        return false;
      }
      if (!result) {
        const interrupted: DownloadRecord = {
          ...initial,
          status: 'failed',
          error: 'Download paused by the system. Try again.',
          updatedAt: Date.now(),
        };
        upsertDownload(accountId, interrupted);
        set((state) => ({ records: { ...state.records, [trackId]: interrupted } }));
        return false;
      }
      const completedAt = Date.now();
      const completed: DownloadRecord = {
        ...initial,
        status: 'completed',
        progress: 1,
        fileUri: result.uri,
        bytes: result.size,
        updatedAt: completedAt,
      };
      upsertDownload(accountId, completed);
      set((state) => ({ records: { ...state.records, [trackId]: completed } }));
      setLocalTrackSource(trackId, localSource(result.uri, 'high'));
      haptics.success();
      return true;
    } catch {
      tasks.delete(trackId);
      lastPersist.delete(trackId);
      const isCancel = cancelled.has(trackId);
      cancelled.delete(trackId);
      const failed: DownloadRecord = {
        trackId,
        status: 'failed',
        progress: 0,
        bytes: 0,
        quality: 'high',
        createdAt: records[trackId]?.createdAt ?? Date.now(),
        updatedAt: Date.now(),
        error: isCancel ? 'Download cancelled.' : 'Download failed. Check your connection.',
      };
      upsertDownload(accountId, failed);
      set((state) => ({ records: { ...state.records, [trackId]: failed } }));
      return false;
    }
  },

  cancel: (trackId) => {
    const task = tasks.get(trackId);
    if (!task) return;
    cancelled.add(trackId);
    try {
      task.cancel();
    } catch {
      // Ignore.
    }
    tasks.delete(trackId);
    const { accountId, records } = get();
    if (!accountId) return;
    const current = records[trackId];
    if (!current) return;
    const failed: DownloadRecord = {
      ...current,
      status: 'failed',
      error: 'Download cancelled.',
      updatedAt: Date.now(),
    };
    upsertDownload(accountId, failed);
    set((state) => ({ records: { ...state.records, [trackId]: failed } }));
  },

  remove: async (trackId) => {
    const { accountId, records } = get();
    if (!accountId) return;
    get().cancel(trackId);
    const record = records[trackId];
    if (record?.fileUri) {
      try {
        const file = new File(record.fileUri);
        if (file.exists) file.delete();
      } catch {
        // File may already be gone.
      }
    }
    setLocalTrackSource(trackId, null);
    removeDownload(accountId, trackId);
    set((state) => {
      const recordsCopy = { ...state.records };
      delete recordsCopy[trackId];
      return { records: recordsCopy };
    });
  },

  retry: async (trackId) => {
    const { accountId, records } = get();
    if (!accountId) return false;
    const current = records[trackId];
    if (current) {
      const reset: DownloadRecord = {
        ...current,
        status: 'queued',
        progress: 0,
        bytes: 0,
        error: undefined,
        updatedAt: Date.now(),
      };
      upsertDownload(accountId, reset);
      set((state) => ({ records: { ...state.records, [trackId]: reset } }));
    }
    return get().download(trackId);
  },

  clearAll: async () => {
    const { accountId, records } = get();
    if (!accountId) return;
    for (const trackId of Object.keys(records)) {
      await get().remove(trackId);
    }
    if (Platform.OS !== 'web') {
      try {
        const directory = directoryFor(accountId);
        if (directory.exists) directory.delete();
      } catch {
        // Ignore.
      }
    }
    set({ records: {} });
  },
}));

function warehouseCheck(): void {
  try {
    const free = Paths.availableDiskSpace;
    if (free > 0 && free < 25 * 1024 * 1024) {
      throw new Error('Not enough free space to download. Free up 25 MB and try again.');
    }
  } catch (error) {
    if (error instanceof Error && error.message.includes('Not enough')) throw error;
  }
}
