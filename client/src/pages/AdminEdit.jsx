import { useEffect, useRef, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { api, audioSrc } from '../api';

const TYPE_SUGGESTIONS = [
  'Lecture',
  'Srimad-Bhagavatam',
  'Bhagavad-gita',
  'Caitanya-caritamrta',
  'Conversation',
  'Walk',
  'Interview',
  'Initiation',
  'Nectar of Devotion',
  'Other',
];

const EMPTY = {
  title: '',
  speaker: '',
  type: 'Lecture',
  location: '',
  date: '',
  duration: '',
  excerpt: '',
  transcript: '',
};

export default function AdminEdit() {
  const { id } = useParams();
  const editing = !!id;
  const navigate = useNavigate();
  const [authed, setAuthed] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [audioFile, setAudioFile] = useState('');
  const [busy, setBusy] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [err, setErr] = useState('');
  const fileRef = useRef();

  useEffect(() => {
    api
      .me()
      .then((r) => {
        setAuthed(r.authed);
        if (!r.authed) {
          navigate('/admin/login', { replace: true });
          return;
        }
        if (editing) {
          api
            .lecture(id)
            .then((r2) => {
              setForm({
                title: r2.lecture.title,
                speaker: r2.lecture.speaker,
                type: r2.lecture.type,
                location: r2.lecture.location,
                date: r2.lecture.date,
                duration: r2.lecture.duration,
                excerpt: r2.lecture.excerpt,
                transcript: r2.lecture.transcript,
              });
              setAudioFile(r2.lecture.audio_file);
            })
            .catch((e) => setErr(e.message));
        }
      })
      .catch(() => navigate('/admin/login', { replace: true }));
  }, [id, editing, navigate]);

  function set(field, value) {
    setForm((f) => ({ ...f, [field]: value }));
  }

  async function uploadAudio(file) {
    if (!file) return;
    setUploading(true);
    setErr('');
    try {
      const r = await api.uploadAudio(file);
      if (audioFile) await api.detachAudio(audioFile);
      setAudioFile(r.audio_file);
      fileRef.current.value = '';
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setUploading(false);
    }
  }

  async function removeAudio() {
    if (!audioFile) return;
    setBusy(true);
    try {
      await api.deleteAudio(audioFile);
      setAudioFile('');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  async function save(e) {
    e.preventDefault();
    if (!form.title.trim()) {
      setErr('Title is required.');
      return;
    }
    setBusy(true);
    setErr('');
    try {
      const payload = { ...form, audio_file: audioFile };
      if (editing) await api.updateLecture(id, payload);
      else await api.createLecture(payload);
      navigate('/admin');
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setBusy(false);
    }
  }

  if (authed === null) return <div className="wrap"><div className="panel empty">Checking&hellip;</div></div>;
  if (!authed) return null;

  return (
    <div className="wrap">
      <div className="form-card">
        <h1>{editing ? 'Edit Lecture' : 'Add New Lecture'}</h1>

        <form onSubmit={save}>
          <div className="field">
            <label htmlFor="title">Title *</label>
            <input id="title" value={form.title} onChange={(e) => set('title', e.target.value)} required />
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="speaker">Speaker</label>
              <input id="speaker" value={form.speaker} onChange={(e) => set('speaker', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="type">Type</label>
              <input id="type" list="types" value={form.type} onChange={(e) => set('type', e.target.value)} />
              <datalist id="types">
                {TYPE_SUGGESTIONS.map((t) => (
                  <option key={t} value={t} />
                ))}
              </datalist>
            </div>
          </div>

          <div className="field-row">
            <div className="field">
              <label htmlFor="date">Date</label>
              <input id="date" type="date" value={form.date} onChange={(e) => set('date', e.target.value)} />
            </div>
            <div className="field">
              <label htmlFor="location">Location</label>
              <input id="location" value={form.location} onChange={(e) => set('location', e.target.value)} />
            </div>
          </div>

          <div className="field">
            <label htmlFor="duration">Duration (HH:MM:SS)</label>
            <input id="duration" placeholder="00:45:00" value={form.duration} onChange={(e) => set('duration', e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="excerpt">Short description</label>
            <textarea id="excerpt" rows="2" value={form.excerpt} onChange={(e) => set('excerpt', e.target.value)} />
          </div>

          <div className="field">
            <label htmlFor="transcript">Transcript</label>
            <textarea id="transcript" rows="12" value={form.transcript} onChange={(e) => set('transcript', e.target.value)} />
          </div>

          <div className="field">
            <label>Audio file (mp3, m4a, wav&hellip;)</label>
            {audioFile ? (
              <div className="upload-row">
                <span className="audio-chip">&#128266; {audioFile}</span>
                <audio controls src={audioSrc(audioFile)} style={{ maxWidth: 240 }} />
                <button type="button" className="btn btn-danger" disabled={busy} onClick={removeAudio}>
                  Remove
                </button>
              </div>
            ) : (
              <div className="hint">No audio attached.</div>
            )}
            <div className="upload-row" style={{ marginTop: 8 }}>
              <input ref={fileRef} type="file" accept=".mp3,.m4a,.wav,.ogg,.webm,.mp4,audio/*" onChange={(e) => uploadAudio(e.target.files[0])} />
              {uploading && <span className="muted">Uploading&hellip;</span>}
            </div>
          </div>

          {err && <div className="alert alert-error">{err}</div>}

          <div style={{ display: 'flex', gap: 10, marginTop: 8 }}>
            <button className="btn btn-primary" type="submit" disabled={busy || uploading}>
              {busy ? 'Saving...' : editing ? 'Save changes' : 'Create lecture'}
            </button>
            <button className="btn btn-ghost" type="button" onClick={() => navigate('/admin')}>
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}