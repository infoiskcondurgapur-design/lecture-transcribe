import fs from 'node:fs';
import path from 'node:path';

const dataDir = path.resolve(import.meta.dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });

const url =
  process.env.TURSO_DATABASE_URL ||
  'file:' + path.join(dataDir, 'archive.db').replace(/\\/g, '/');

const isRemote = url.startsWith('libsql:') || url.startsWith('https:');
const { createClient } = isRemote
  ? await import('@libsql/client/web')
  : await import('@libsql/client');

export const client = createClient({
  url,
  authToken: process.env.TURSO_AUTH_TOKEN || undefined,
  timeout: 15000,
});

const SCHEMA = `
CREATE TABLE IF NOT EXISTS lectures (
  id         INTEGER PRIMARY KEY AUTOINCREMENT,
  title      TEXT NOT NULL,
  speaker    TEXT NOT NULL DEFAULT '',
  type       TEXT NOT NULL DEFAULT 'Lecture',
  location   TEXT NOT NULL DEFAULT '',
  date       TEXT NOT NULL DEFAULT '',
  duration   TEXT NOT NULL DEFAULT '',
  audio_file TEXT NOT NULL DEFAULT '',
  excerpt    TEXT NOT NULL DEFAULT '',
  transcript TEXT NOT NULL DEFAULT '',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS settings (
  key   TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
`;

await client.executeMultiple(SCHEMA);

function toObject(rs, row) {
  const obj = {};
  for (let i = 0; i < rs.columns.length; i++) obj[rs.columns[i]] = row[i];
  return obj;
}

export async function all(sql, args = []) {
  const rs = await client.execute({ sql, args });
  return rs.rows.map((row) => toObject(rs, row));
}

export async function get(sql, args = []) {
  const rows = await all(sql, args);
  return rows[0];
}

export async function run(sql, args = []) {
  const rs = await client.execute({ sql, args });
  return {
    lastInsertRowid: Number(rs.lastInsertRowid ?? 0),
    changes: rs.rowsAffected,
  };
}