import { useEffect, useState } from 'react';
import { api, formatDate } from '../api';
import LectureList from '../components/LectureList';

export default function Home() {
  const [stats, setStats] = useState(null);
  const [recent, setRecent] = useState([]);
  const [bookmarkIds, setBookmarkIds] = useState([]);
  const [progressIds, setProgressIds] = useState([]);

  useEffect(() => {
    api.stats().then(setStats).catch(() => {});
    api.lectures({ limit: 5 }).then((r) => setRecent(r.records)).catch(() => {});
  }, []);

  useEffect(() => {
    api.getBookmarks().then((r) => setBookmarkIds(r.ids || [])).catch(() => {});
  }, []);

  useEffect(() => {
    api.getProgress().then((r) => setProgressIds(r.ids || [])).catch(() => {});
  }, []);

  const topTypes = (stats?.byType || []).slice(0, 4);
  const rest = (stats?.byType || []).slice(4);

  return (
    <div className="wrap">
      <section className="hero">
        <h2>A Library of Lectures &amp; Their Transcriptions</h2>
        <p>
          Browse, listen, and read transcripts of lectures and conversations,
          organized by type, year, and location. Every word is searchable.
        </p>
        <form className="search-bar" action="/search" method="get" onSubmit={(e) => { e.preventDefault(); window.location.href = '/search?q=' + encodeURIComponent(e.target.q.value || ''); }}>
          <input name="q" placeholder="Search the transcripts, e.g. karma-yoga or consciousness..." />
          <button className="btn btn-primary" type="submit">&#128269; Search</button>
        </form>
      </section>

      {stats && (
        <section className="stat-cards">
          <div className="stat-card">
            <div className="num">{stats.lectures}</div>
            <div className="label">Transcripts</div>
          </div>
          <div className="stat-card">
            <div className="num">{stats.hasAudio}</div>
            <div className="label">With Audio</div>
          </div>
          {topTypes.map((t) => (
            <div className="stat-card" key={t.type}>
              <div className="num">{t.c}</div>
              <div className="label">{t.type}</div>
            </div>
          ))}
          {!topTypes.length && (
            <div className="stat-card">
              <div className="num">0</div>
              <div className="label">Lectures</div>
            </div>
          )}
        </section>
      )}

      {rest.length > 0 && (
        <p className="muted" style={{ textAlign: 'center', fontSize: 13 }}>
          Also: {rest.map((t) => `${t.type} (${t.c})`).join('  \u00B7  ')}
        </p>
      )}

      <div className="section-title">
        <h2>Latest Lectures</h2>
        <a href="/transcriptions">View all transcriptions &rarr;</a>
      </div>

      <LectureList lectures={recent} bookmarkIds={bookmarkIds} progressIds={progressIds} onToggle={() => api.getBookmarks().then((r) => setBookmarkIds(r.ids || [])).catch(() => {})} />
    </div>
  );
}
