import { randomUUID } from 'expo-crypto';

export function createId(prefix = 'id'): string {
  try {
    return `${prefix}_${randomUUID()}`;
  } catch {
    return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 10)}`;
  }
}
