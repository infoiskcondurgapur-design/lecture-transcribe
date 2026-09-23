import { useState } from 'react';
import { api } from '../api';

export default function BookmarkBtn({ lectureId, initial, onToggle }) {
  const [marked, setMarked] = useState(initial);
  return (
    <button
      className={marked ? 'btn btn-primary' : 'btn btn-ghost'}
      style={{ fontSize: 14, padding: '4px 8px', minWidth: 32 }}
      onClick={async () => {
        try {
          await api.toggleBookmark(lectureId);
          setMarked(!marked);
          if (onToggle) onToggle();
        } catch {}
      }}
    >
      {marked ? '★' : '☆'}
    </button>
  );
}