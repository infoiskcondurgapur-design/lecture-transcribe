import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, formatDate } from '../api';

export default function AdminDashboard() {
  const [authed, setAuthed] = useState(null);
  const [data, setData] = useState(null);
  const [page, setPage] = useState(1);
  const [deleting, setDeleting] = useState(null);
  const [err, setErr] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    api
      .me()
      .then((r) => {
        setAuthed(r.authed);
        if (!r.authed) navigate('/admin/login', { replace: true });
      })
      .catch(() => navigate('/admin/login', { replace: true }));
  }, [navigate]);

  useEffect(() => {
    if (!authed) return;
    api
      .lectures({ limit: 20, page })
      .then((r) => setData(r))
      .catch((e) => setErr(e.message));
  }, [authed, page]);

  async function logout() {
    try {
      await api.logout();
    } finally {
      navigate('/admin/login', { replace: true });
    }
  }

  async function remove(lec) {
    if (!window.confirm(`Delete "${lec.title}"? This cannot be undone.`)) return;
    setDeleting(lec.id);
    try {
      if (lec.audio_file) await api.detachAudio(lec.audio_file);
      await api.deleteLecture(lec.id);
      setData((d) => ({ ...d, records: d.records.filter((x) => x.id !== lec.id), total: d.total - 1 }));
    } catch (ex) {
      setErr(ex.message);
    } finally {
      setDeleting(null);
    }
  }

  if (authed === null) return <div className="wrap"><div className="panel empty">Checking&hellip;</div></div>;
  if (!authed) return null;

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="wrap">
      <div className="action-bar">
        <div>
          <h2 style={{ margin: '18px 0 0' }}>Admin Dashboard</h2>
          <p className="muted" style={{ margin: '2px 0 0' }}>
            {data ? `${data.total} lecture${data.total === 1 ? '' : 's'} in the archive` : ''}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button className="btn btn-primary" onClick={() => navigate('/admin/new')}>
            + Add lecture
          </button>
          <button className="btn btn-ghost" onClick={logout}>
            Log out
          </button>
        </div>
      </div>

      {err && <div className="alert alert-error">{err}</div>}
      {!err && data && (
        <>
          <div className="admin-list">
            {data.records.map((lec) => (
              <div className="lecture-row" key={lec.id}>
                <span className="play-ic" aria-hidden="true">{lec.audio_file ? '\u25B6' : '\u270E'}</span>
                <div className="info">
                  <span className="title-link">{lec.title}</span>
                  <div className="meta">
                    <span className="tag">{lec.type}</span>
                    {formatDate(lec.date) && <span>{formatDate(lec.date)}</span>}
                    {lec.location && <span>&#9873; {lec.location}</span>}
                  </div>
                </div>
                <div className="row-actions">
                  <button className="btn btn-ghost" onClick={() => navigate('/admin/edit/' + lec.id)}>
                    Edit
                  </button>
                  <button className="btn btn-danger" disabled={deleting === lec.id} onClick={() => remove(lec)}>
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setPage(page - 1)}>&laquo;</button>
              <span className="page" style={{ cursor: 'default' }}>
                {page} / {totalPages}
              </span>
              <button disabled={page >= totalPages} onClick={() => setPage(page + 1)}>&raquo;</button>
            </div>
          )}
        </>
      )}
    </div>
  );
}