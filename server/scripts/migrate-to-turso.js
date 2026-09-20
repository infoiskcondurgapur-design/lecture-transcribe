import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { put } from '@vercel/blob';
import { client, all as tursoAll, run as tursoRun, get as tursoGet } from '../db.js';

const OLD_DB = path.resolve(import.meta.dirname, '..', 'data', 'archive.db');
const AUDIO_DIR = path.resolve(import.meta.dirname, '..', 'public', 'audio');

async function main() {
  if (!process.env.TURSO_DATABASE_URL) {
    console.error('Set TURSO_DATABASE_URL (and TURSO_AUTH_TOKEN) in server/.env first.');
    process.exit(1);
  }
  if (!fs.existsSync(OLD_DB)) {
    console.error(`No local database found at ${OLD_DB}`);
    process.exit(1);
  }

  const old = new Database(OLD_DB, { readonly: true });
  const blobEnabled = !!process.env.BLOB_READ_WRITE_TOKEN;
  let uploaded = 0;

  console.log('Migrating data to Turso...');

  // settings (e.g. admin_password_hash)
  const settingsRows = old.prepare('SELECT key, value FROM settings').all();
  for (const row of settingsRows) {
    const existing = await tursoGet('SELECT value FROM settings WHERE key = ?', [row.key]);
    if (!existing) {
      await tursoRun('INSERT INTO settings (key, value) VALUES (?, ?)', [row.key, row.value]);
    }
  }
  console.log(`Copied ${settingsRows.length} setting(s).`);

  // lectures
  const rows = old.prepare('SELECT * FROM lectures ORDER BY id').all();
  for (const row of rows) {
    const copy = { ...row };
    if (copy.audio_file && blobEnabled) {
      const local = path.join(AUDIO_DIR, path.basename(copy.audio_file));
      if (/^https?:\/\//.test(copy.audio_file)) {
        /* already remote, keep */
      } else if (fs.existsSync(local)) {
        const buf = fs.readFileSync(local);
        const blob = await put(`audio/${Date.now()}-${path.basename(copy.audio_file)}`, buf, {
          access: 'public',
          addRandomSuffix: true,
        });
        copy.audio_file = blob.url;
        uploaded++;
        console.log(`  uploaded ${path.basename(local)} -> blob`);
      } else {
        copy.audio_file = '';
        console.log(`  skipped missing audio: ${copy.audio_file}`);
      }
    }
    await tursoRun(
      `INSERT INTO lectures
         (id, title, speaker, type, location, date, duration, audio_file, excerpt, transcript, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        copy.id, copy.title, copy.speaker, copy.type, copy.location,
        copy.date, copy.duration, copy.audio_file, copy.excerpt,
        copy.transcript, copy.created_at, copy.updated_at,
      ]
    );
  }
  console.log(`Copied ${rows.length} lecture(s)${blobEnabled ? `, uploaded ${uploaded} audio file(s) to Blob` : ' (audio left as local references)'}.`);

  old.close();
  await client.close();
  console.log('Migration complete.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});