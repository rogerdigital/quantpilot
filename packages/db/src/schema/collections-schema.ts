import { sqliteTable, text } from 'drizzle-orm/sqlite-core';

/**
 * Generic collection table — stores JSON-serialised arrays under a
 * (namespace, id) composite key.  One row per "collection file" that
 * the file-based adapter would have written to disk.
 */
export const collections = sqliteTable('collections', {
  id: text('id').notNull(),          // collection filename (e.g. 'backtest_run.json')
  namespace: text('namespace').notNull(),
  entries: text('entries').notNull(), // JSON.stringify(T[])
  updatedAt: text('updated_at').notNull(),
});

/**
 * Generic object table — stores individual JSON objects keyed by
 * (namespace, id).  Mirrors the kv-store / readObject / writeObject API.
 */
export const objects = sqliteTable('objects', {
  id: text('id').notNull(),          // object filename (e.g. '_manifest.json')
  namespace: text('namespace').notNull(),
  data: text('data').notNull(),       // JSON.stringify(T)
  updatedAt: text('updated_at').notNull(),
});
