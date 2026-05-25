import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const DATA_DIR = join(process.cwd(), '.quantpilot', 'auth');

export function persistMap<K, V>(filename: string, map: Map<K, V>) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, filename), JSON.stringify([...map.entries()], null, 2));
}

export function loadMap<K, V>(filename: string, map: Map<K, V>) {
  const filePath = join(DATA_DIR, filename);
  if (!existsSync(filePath)) return;
  try {
    const entries = JSON.parse(readFileSync(filePath, 'utf8')) as Array<[K, V]>;
    for (const [key, value] of entries) {
      map.set(key, value);
    }
  } catch {
    // corrupted file, start fresh
  }
}

export function persistArray<T>(filename: string, items: T[]) {
  mkdirSync(DATA_DIR, { recursive: true });
  writeFileSync(join(DATA_DIR, filename), JSON.stringify(items, null, 2));
}

export function loadArray<T>(filename: string): T[] {
  const filePath = join(DATA_DIR, filename);
  if (!existsSync(filePath)) return [];
  try {
    return JSON.parse(readFileSync(filePath, 'utf8')) as T[];
  } catch {
    return [];
  }
}
