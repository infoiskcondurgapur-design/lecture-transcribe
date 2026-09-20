import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { api } from '../api';
import LectureList from '../components/LectureList';

export default function Search() {
  const [params, setParams] = useSearchParams();
  const [input, setInput] = useState(params.get('q') || '');
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  const q = params.get('q') || '';
  const page = parseInt(params.get('page'), 10) || 1;

  useEffect(() => {
    if (!q) {
      setData(null);
      return;
    }
    setLoading(true);
    setErr('');
    api
      .lectures({ q, page, limit: 10 })
      .then((r) => setData(r))
      .catch((e) => setErr(e.message))
      .finally(() => setLoading(false));
  }, [q, page]);

  function submit(e) {
    e.preventDefault();
    setParams({ q: input });
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <div className="wrap">
      <div className="hero">
        <h2>Search the Transcripts</h2>
        <p>Full-text search across titles and the spoken words of every lecture.</p>
        <form className="search-bar" onSubmit={submit}>
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="e.g. consciousness, karma-yoga, Mayapur..."
          />
          <button className="btn btn-primary" type="submit">&#128269; Search</button>
        </form>
      </div>

      {err && <div className="alert alert-error">{err}</div>}

      {!q && !err && <div className="panel empty">Type a phrase above to search within the transcripts.</div>}

      {q && !loading && data && (
        <>
          <div className="results-head">
            <h2>
              {data.total} result{data.total === 1 ? '' : 's'}
              {` `}for &ldquo;{q}&rdquo;
            </h2>
          </div>
          <LectureList lectures={data.records} />
          {totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => setParams({ q, page: String(page - 1) })}>&laquo;</button>
              {Array.from({ length: totalPages }, (_, i) => (
                <span
                  key={i + 1}
                  className={'page' + (i + 1 === page ? ' current' : '')}
                  onClick={() => setParams({ q, page: String(i + 1) })}
                  style={{ cursor: 'pointer' }}
                >
                  {i + 1}
                </span>
              ))}
              <button disabled={page >= totalPages} onClick={() => setParams({ q, page: String(page + 1) })}>&raquo;</button>
            </div>
          )}
        </>
      )}

      {q && loading && <div className="panel empty">Searching&hellip;</div>}
    </div>
  );
}