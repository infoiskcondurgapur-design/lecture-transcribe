async function request(path, opts = {}) {
  const init = {
    credentials: 'include',
    ...opts,
  };
  if (opts.body && typeof opts.body === 'object' && !(opts.body instanceof FormData)) {
    init.body = JSON.stringify(opts.body);
    init.headers = { 'Content-Type': 'application/json', ...(opts.headers || {}) };
  }
  const res = await fetch('/api' + path, init);
  if (!res.ok) {
    let err = res.statusText;
    try {
      const j = await res.json();
      if (j && j.error) err = j.error;
    } catch {
      /* ignore */
    }
    throw new Error(err);
  }
  const ct = res.headers.get('content-type') || '';
  return ct.includes('application/json') ? res.json() : res.text();
}

let metaPromise;
function getMeta() {
  if (!metaPromise) metaPromise = request('/upload/meta').catch(() => ({ blobUpload: false }));
  return metaPromise;
}

export const api = {
  lectures: (params) => request('/lectures?' + new URLSearchParams(params).toString()),
  lecture: (id) => request('/lectures/' + id),
  filters: () => request('/filters'),
  stats: () => request('/stats'),
  login: (password) => request('/auth/login', { method: 'POST', body: { password } }),
  logout: () => request('/auth/logout', { method: 'POST' }),
  me: () => request('/auth/me'),
  createLecture: (data) => request('/lectures', { method: 'POST', body: data }),
  updateLecture: (id, data) => request('/lectures/' + id, { method: 'PUT', body: data }),
  deleteLecture: (id) => request('/lectures/' + id, { method: 'DELETE' }),
  getBookmarks: () => request('/bookmarks'),
  toggleBookmark: (id) => request('/bookmarks/' + id, { method: 'POST' }),
  uploadAudio: async (file) => {
    const meta = await getMeta();
    if (meta.blobUpload) {
      const { upload } = await import('@vercel/blob/client');
      const blob = await upload(file.name, file, {
        access: 'public',
        handleUploadUrl: '/api/upload/token',
        clientPayload: null,
      });
      return { audio_file: blob.url };
    }
    const fd = new FormData();
    fd.append('audio', file);
    return request('/upload', { method: 'POST', body: fd });
  },
  detachAudio: (audio_file) =>
    request('/upload/detach', { method: 'POST', body: { audio_file } }),
  deleteAudio: (file) => request('/upload/' + encodeURIComponent(file), { method: 'DELETE' }),
};

export function audioSrc(value) {
  if (!value) return '';
  return /^https?:\/\//.test(value) ? value : '/audio/' + encodeURIComponent(value);
}

export function formatDate(date) {
  if (!date) return '';
  const d = new Date(date + (date.length === 4 ? '-01-01' : ''));
  if (isNaN(d)) return date;
  return d.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
}