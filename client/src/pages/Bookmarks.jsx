import { useEffect, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { api } from '../api';
import LectureList from '../components/LectureList';
import BookmarkBtn from '../components/BookmarkBtn';

export default function Bookmarks() {
  const [params, setParams] = useSearchParams();
  const [bookmarkIds, setBookmarkIds] = useState([]);
  const [progressIds, setProgressIds] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  const sharedIds = params.get('ids');

  useEffect(() => {
    if (sharedIds) {
      const ids = sharedIds.split(',').map(Number).filter((n) => Number.isFinite(n));
      setBookmarkIds(ids);
    } else {
      api.getBookmarks().then((r) => setBookmarkIds(r.ids || [])).catch(() => {});
    }
  }, [sharedIds]);

  useEffect(() => {
    api.getProgress().then((r) => setProgressIds(r.ids || [])).catch(() => {});
  }, []);

  useEffect(() => {
    if (!bookmarkIds.length) { setLectures([]); setLoading(false); return; }
    let cancelled = false;
    setLoading(true);
    Promise.all(bookmarkIds.map((id) => api.lecture(id).then((r) => r.lecture).catch(() => null)))
      .then((results) => {
        if (!cancelled) {
          setLectures(results.filter(Boolean));
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [bookmarkIds]);

  function share() {
    const url = window.location.origin + window.location.pathname + '?ids=' + bookmarkIds.join(',');
    navigator.clipboard.writeText(url).catch(() => {});
  }

  function toggle(id) {
    api.toggleBookmark(id).then((r) => {
      setBookmarkIds(r.ids || []);
    }).catch(() => {});
  }

  if (loading) return <div className="wrap"><div className="panel empty">Loading&hellip;</div></div>;

  return (
    <div className="wrap">
      <div className="section-title">
        <h2>Bookmarked Lectures</h2>
        {bookmarkIds.length > 0 && (
          <button className="btn btn-ghost" onClick={share} style={{ fontSize: 13, padding: '7px 12px' }}>
            &#128279; Share
          </button>
        )}
      </div>
      {lectures.length === 0 ? (
        <div className="panel empty">No bookmarks yet. Tap the ★ on any lecture to bookmark it.</div>
      ) : (
        <LectureList lectures={lectures} bookmarkIds={bookmarkIds} progressIds={progressIds} onToggle={() => api.getBookmarks().then((r) => setBookmarkIds(r.ids || [])).catch(() => {})} />
      )}
    </div>
  );
}
