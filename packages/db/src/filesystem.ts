import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';

export function ensureDirectory(pathname: string) {
  mkdirSync(pathname, { recursive: true });
}

export function readJsonFile(pathname: string, fallback: any): any {
  if (!existsSync(pathname)) {
    return fallback;
  }
  try {
    return JSON.parse(readFileSync(pathname, 'utf8'));
  } catch {
    return fallback;
  }
}

export function writeJsonFile(pathname: string, value: any) {
  writeFileSync(pathname, JSON.stringify(value, null, 2));
}
