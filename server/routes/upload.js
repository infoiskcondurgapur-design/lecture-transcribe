import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { handleUpload } from '@vercel/blob/client';
import { del } from '@vercel/blob';
import { requireAdmin, isAdmin } from '../middleware.js';

const AUDIO_DIR = path.resolve(import.meta.dirname, '..', 'public', 'audio');
if (!fs.existsSync(AUDIO_DIR)) fs.mkdirSync(AUDIO_DIR, { recursive: true });

const BLOB_MODE = !!process.env.BLOB_READ_WRITE_TOKEN;

const ALLOWED_EXT = ['.mp3', '.m4a', '.wav', '.ogg', '.webm', '.mp4'];
const ALLOWED_MIME = [
  'audio/mpeg',
  'audio/mp4',
  'audio/x-m4a',
  'audio/wav',
  'audio/x-wav',
  'audio/vnd.wave',
  'audio/ogg',
  'audio/webm',
  'video/mp4',
];

const EXT_FOR_MIME = {
  'audio/mpeg': '.mp3',
  'audio/mp4': '.m4a',
  'audio/x-m4a': '.m4a',
  'audio/wav': '.wav',
  'audio/x-wav': '.wav',
  'audio/vnd.wave': '.wav',
  'audio/ogg': '.ogg',
  'audio/webm': '.webm',
  'video/mp4': '.mp4',
};

const upload = multer({
  storage: multer.diskStorage({
    destination: AUDIO_DIR,
    filename: (req, file, cb) => {
      const ext = EXT_FOR_MIME[file.mimetype] || path.extname(file.originalname).toLowerCase();
      cb(null, `${Date.now()}-${crypto.randomBytes(4).toString('hex')}${ext}`);
    },
  }),
  limits: { fileSize: 300 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    if (ALLOWED_EXT.includes(ext)) return cb(null, true);
    cb(new Error('Only audio files are allowed'));
  },
});

function isRemote(value) {
  return typeof value === 'string' && /^https?:\/\//.test(value);
}

async function deleteAudioFile(value) {
  if (!value) return;
  if (isRemote(value)) {
    if (!BLOB_MODE) throw new Error('Remote audio cannot be deleted in local mode');
    await del(value);
    return;
  }
  const safe = path.basename(value);
  await fs.promises.unlink(path.join(AUDIO_DIR, safe)).catch(() => {});
}

export function router(express) {
  const r = express.Router();

  r.get('/meta', (req, res) => {
    res.json({ blobUpload: BLOB_MODE });
  });

  // Blog uploads: token exchange endpoint (browser -> Vercel Blob directly)
  r.post('/token', async (req, res) => {
    const body = req.body || {};
    if (body.type === 'blob.upload-completed') {
      // webhook from Blob infra (no session); we persist via the client's PUT later
      return res.json({ type: 'blob.upload-completed', response: 'ok' });
    }
    if (!isAdmin(req)) {
      return res.status(401).json({ error: 'Not authorized' });
    }
    if (!BLOB_MODE) {
      return res.status(400).json({ error: 'Blob upload is not configured' });
    }
    try {
      const result = await handleUpload({
        request: req,
        body,
        onBeforeGenerateToken: async () => ({
          allowedContentTypes: ALLOWED_MIME,
          maximumSizeInBytes: 200 * 1024 * 1024,
          addRandomSuffix: true,
        }),
        onUploadCompleted: async () => {},
      });
      res.json(result);
    } catch (e) {
      res.status(400).json({ error: e.message || 'Upload token failed' });
    }
  });

  // Local (dev) upload
  r.post('/', requireAdmin, upload.single('audio'), (req, res) => {
    if (BLOB_MODE) return res.status(400).json({ error: 'Use the client upload endpoint' });
    if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
    res.json({ audio_file: req.file.filename });
  });

  // Unlink an audio file (dev local file or BLOB url)
  r.post('/detach', requireAdmin, async (req, res) => {
    const { audio_file } = req.body || {};
    await deleteAudioFile(audio_file).catch(() => {});
    res.json({ ok: true });
  });

  r.delete('/:file', requireAdmin, async (req, res) => {
    await deleteAudioFile(req.params.file).catch((e) => {
      return res.status(500).json({ error: e.message || 'Delete failed' });
    });
    res.json({ ok: true });
  });

  return r;
}

export { BLOB_MODE, AUDIO_DIR };