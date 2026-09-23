import { Link } from 'react-router-dom';
import { formatDate } from '../api';
import BookmarkBtn from './BookmarkBtn';

export default function LectureList({ lectures, bookmarkIds }) {
  const ids = bookmarkIds ? new Set(bookmarkIds) : new Set();
  if (!lectures || lectures.length === 0) {
    return <div className="empty">No lectures found.</div>;
  }
  return (
    <div>
      {lectures.map((lec) => (
        <div className="lecture-row" key={lec.id}>
          <span className="play-ic" aria-hidden="true">
            {lec.audio_file ? '\u25B6' : '\u270E'}
          </span>
          <div className="info">
            <Link to={'/lecture/' + lec.id} className="title-link">
              {lec.title}
            </Link>
            <div className="meta">
              <span className="tag">{lec.type}</span>
              {lec.speaker && <span>{lec.speaker}</span>}
              {formatDate(lec.date) && <span>{formatDate(lec.date)}</span>}
              {lec.location && <span>&#9873; {lec.location}</span>}
              {lec.duration && <span>&#9200; {lec.duration}</span>}
              {lec.audio_file ? (
                <span className="audio-chip">&#128266; Has audio</span>
              ) : (
                <span className="tag tag-muted">Text only</span>
              )}
            </div>
          </div>
          <BookmarkBtn lectureId={lec.id} initial={ids.has(lec.id)} />
        </div>
      ))}
    </div>
  );
}