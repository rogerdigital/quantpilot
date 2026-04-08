import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export function ensureDirectory(pathname) {
  mkdirSync(pathname, { recursive: true });
}

export function readJsonFile(pathname, fallback) {
  if (!existsSync(pathname)) {
    return fallback;
  }
  try {
    return JSON.parse(readFileSync(pathname, 'utf8'));
  } catch {
    return fallback;
  }
}

export function writeJsonFile(pathname, value) {
  writeFileSync(pathname, JSON.stringify(value, null, 2));
}
