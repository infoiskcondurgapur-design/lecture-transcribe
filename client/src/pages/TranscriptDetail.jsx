import { useEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, formatDate, audioSrc } from '../api';

export default function TranscriptDetail() {
  const { id } = useParams();
  const [lec, setLec] = useState(null);
  const [err, setErr] = useState('');
  const [playing, setPlaying] = useState(false);
  const audioRef = useRef();

  useEffect(() => {
    api
      .lecture(id)
      .then((r) => setLec(r.lecture))
      .catch((e) => setErr(e.message));
  }, [id]);

  if (err) return <div className="wrap"><div className="alert alert-error">{err}</div></div>;
  if (!lec) return <div className="wrap"><div className="panel empty">Loading&hellip;</div></div>;

  return (
    <div className="wrap">
      <div className="crumb">
        <Link to="/transcriptions">&larr; Back to transcriptions</Link>
      </div>

      <div className="detail-head">
        <h1>{lec.title}</h1>
        <div className="meta-grid">
          {lec.speaker && (
            <div>
              <div className="k">Speaker</div>
              <div className="v">{lec.speaker}</div>
            </div>
          )}
          <div>
            <div className="k">Type</div>
            <div className="v">{lec.type}</div>
          </div>
          {formatDate(lec.date) && (
            <div>
              <div className="k">Date</div>
              <div className="v">{formatDate(lec.date)}</div>
            </div>
          )}
          {lec.location && (
            <div>
              <div className="k">Location</div>
              <div className="v">{lec.location}</div>
            </div>
          )}
          {lec.duration && (
            <div>
              <div className="k">Duration</div>
              <div className="v">{lec.duration}</div>
            </div>
          )}
        </div>

        <div className="chips">
          {lec.audio_file ? (
            <span className="audio-chip">&#128266; Audio recording available</span>
          ) : (
            <span className="tag tag-muted">Text only</span>
          )}
        </div>

        {lec.audio_file && (
          <div className="audio-box">
            <audio ref={audioRef} src={audioSrc(lec.audio_file)} preload="none" onEnded={() => setPlaying(false)} onPause={() => setPlaying(false)} onPlay={() => setPlaying(true)} />
            <button className="btn btn-ghost" onClick={() => { if (audioRef.current) { if (playing) audioRef.current.pause(); else audioRef.current.play(); } }}>
              {playing ? 'Pause' : 'Play'}
            </button>
          </div>
        )}
      </div>

      {lec.excerpt && <p className="muted" style={{ marginTop: 10 }}>{lec.excerpt}</p>}

      <div className="transcript-box">
        <h2>Transcript</h2>
        <div className="transcript-text" onContextMenu={(e) => e.preventDefault()}>{lec.transcript}</div>
      </div>
    </div>
  );
}