import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../api';
import LectureList from '../components/LectureList';

export default function Transcriptions() {
  const [params, setParams] = useSearchParams();
  const [data, setData] = useState(null);
  const [filters, setFilters] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookmarkIds, setBookmarkIds] = useState([]);

  const page = parseInt(params.get('page'), 10) || 1;
  const active = useMemo(
    () => ({
      type: params.get('type') || '',
      location: params.get('location') || '',
      year: params.get('year') || '',
      has_audio: params.get('has_audio') || '',
    }),
    [params]
  );

  useEffect(() => {
    api.filters().then(setFilters).catch(() => {});
  }, []);

  useEffect(() => {
    api.getBookmarks().then((r) => setBookmarkIds(r.ids || [])).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const q = Object.entries(active)
      .filter(([, v]) => v)
      .reduce((o, [k, v]) => ((o[k] = v), o), {});
    q.page = page;
    q.limit = 12;
    api
      .lectures(q)
      .then((r) => setData(r))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, [page, active]);

  function setActive(key, value) {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setParams(next, { replace: false });
  }

  function clearAll() {
    setParams(new URLSearchParams(), { replace: false });
  }

  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const hasActive = Object.values(active).some(Boolean);

  return (
    <div className="wrap">
      <div className="list-layout">
        <aside className="filters panel">
          <h3>Filters</h3>

          <div className="facet">
            <div className="k muted" style={{ fontSize: 12, textTransform: 'uppercase', letterSpacing: 1, marginBottom: 6 }}>
              Audio
            </div>
            {[
              ['yes', 'Has audio'],
              ['no', 'Text only'],
            ].map(([v, label]) => (
              <a
                key={v}
                className={'facet-link' + (active.has_audio === v ? ' active' : '')}
                href="#"
                onClick={(e) => { e.preventDefault(); setActive('has_audio', active.has_audio === v ? '' : v); }}
              >
                <span>{label}</span>
              </a>
            ))}
          </div>

          <div className="facet">
            <h3>Type</h3>
            {filters?.types.map((t) => (
              <a
                key={t.type}
                className={'facet-link' + (active.type === t.type ? ' active' : '')}
                href="#"
                onClick={(e) => { e.preventDefault(); setActive('type', active.type === t.type ? '' : t.type); }}
              >
                <span>{t.type}</span>
                <span className="count">{t.c}</span>
              </a>
            ))}
            {filters && !filters.types.length && <div className="muted" style={{ fontSize: 13 }}>No types yet.</div>}
          </div>

          <div className="facet">
            <h3>Year</h3>
            {filters?.years.map((y) => (
              <a
                key={y}
                className={'facet-link' + (active.year === y ? ' active' : '')}
                href="#"
                onClick={(e) => { e.preventDefault(); setActive('year', active.year === y ? '' : y); }}
              >
                <span>{y}</span>
              </a>
            ))}
          </div>

          <div className="facet">
            <h3>Location</h3>
            {filters?.locations.map((l) => (
              <a
                key={l.location}
                className={'facet-link' + (active.location === l.location ? ' active' : '')}
                href="#"
                onClick={(e) => { e.preventDefault(); setActive('location', active.location === l.location ? '' : l.location); }}
              >
                <span>{l.location}</span>
                <span className="count">{l.c}</span>
              </a>
            ))}
          </div>

          {hasActive && (
            <a className="clear-filters" href="#" onClick={(e) => { e.preventDefault(); clearAll(); }}>
              &#10005; Clear all filters
            </a>
          )}
        </aside>

        <section>
          <div className="results-head">
            <h2>
              {loading ? 'Loading...' : `${data?.total ?? 0} record${data?.total === 1 ? '' : 's'}`}
            </h2>
            {hasActive && (
              <span className="muted" style={{ fontSize: 13 }}>
                Filtered {Object.entries(active).filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join('  ')}
              </span>
            )}
          </div>

          {loading && <div className="panel empty">Loading lectures&hellip;</div>}
          {!loading && <LectureList lectures={data?.records} bookmarkIds={bookmarkIds} />}

          {data && totalPages > 1 && (
            <div className="pagination">
              <button disabled={page <= 1} onClick={() => { const n = new URLSearchParams(params); n.set('page', String(page - 1)); setParams(n); }}>
                &laquo;
              </button>
              <PaginationButtons page={page} totalPages={totalPages} setPage={(p) => { const n = new URLSearchParams(params); n.set('page', String(p)); setParams(n); }} />
              <button disabled={page >= totalPages} onClick={() => { const n = new URLSearchParams(params); n.set('page', String(page + 1)); setParams(n); }}>
                &raquo;
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

function PaginationButtons({ page, totalPages, setPage }) {
  const pages = [];
  for (let p = 1; p <= totalPages; p++) {
    if (p === 1 || p === totalPages || Math.abs(p - page) <= 2) pages.push(p);
  }
  const out = [];
  let last = 0;
  for (const p of pages) {
    if (last && p - last > 1) out.push(<span key={'gap' + p} className="page">…</span>);
    out.push(
      <span key={p} className={'page' + (p === page ? ' current' : '')} onClick={() => p !== page && setPage(p)} style={p !== page ? { cursor: 'pointer' } : undefined}>
        {p}
      </span>
    );
    last = p;
  }
  return <>{out}</>;
}