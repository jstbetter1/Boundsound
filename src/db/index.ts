import {
  registerExternalTrack,
  registerTrackSources,
  resetExternalCatalog,
} from '@/data/catalog';

import { initDatabaseAsync } from './database';
import { listExternalTracks, listTrackLinks } from './external';

export * from './database';
export * from './accounts';
export * from './settings';
export * from './library';
export * from './downloads';
export * from './conversions';
export * from './connections';
export * from './external';

export function hydrateExternalCatalog(): void {
  resetExternalCatalog();
  for (const track of listExternalTracks()) {
    registerExternalTrack(track);
  }
  for (const link of listTrackLinks()) {
    registerTrackSources(link.trackId, [link.source]);
  }
}

let bootPromise: Promise<void> | null = null;

export function bootstrapStorage(): Promise<void> {
  if (!bootPromise) {
    bootPromise = initDatabaseAsync().then(() => hydrateExternalCatalog());
  }
  return bootPromise;
}
