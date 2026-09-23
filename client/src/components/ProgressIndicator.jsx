export default function ProgressIndicator({ read }) {
  if (!read) return null;
  return (
    <span className="progress-tag" title="Read">
      &#10003; Read
    </span>
  );
}
