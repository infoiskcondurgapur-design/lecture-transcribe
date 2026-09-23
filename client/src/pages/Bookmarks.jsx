import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, audioSrc, formatDate } from '../api';
import BookmarkBtn from '../components/BookmarkBtn';

export default function Bookmarks() {
  const navigate = useNavigate();
  const [bookmarkIds, setBookmarkIds] = useState([]);
  const [lectures, setLectures] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.getBookmarks().then((r) => setBookmarkIds(r.ids || [])).catch(() => {}).finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!bookmarkIds.length) { setLectures([]); return; }
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

  if (loading) return <div className="wrap"><div className="panel empty">Loading&hellip;</div></div>;

  return (
    <div className="wrap">
      <div className="section-title">
        <h2>Bookmarked Lectures</h2>
      </div>
      {lectures.length === 0 ? (
        <div className="panel empty">No bookmarks yet. Tap the ★ on any lecture to bookmark it.</div>
      ) : (
        lectures.map((lec) => (
          <div className="lecture-row" key={lec.id}>
            <span className="play-ic" aria-hidden="true">{lec.audio_file ? '\u25B6' : '\u270E'}</span>
            <div className="info">
              <Link to={'/lecture/' + lec.id} className="title-link">{lec.title}</Link>
              <div className="meta">
                <span className="tag">{lec.type}</span>
                {formatDate(lec.date) && <span>{formatDate(lec.date)}</span>}
              </div>
            </div>
            <BookmarkBtn lectureId={lec.id} initial />
          </div>
        ))
      )}
    </div>
  );
}
