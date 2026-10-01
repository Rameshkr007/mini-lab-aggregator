export default function EmptyState({ query }) {
  return (
    <div className="state-box">
      <svg width="40" height="40" viewBox="0 0 40 40" aria-hidden="true">
        <circle cx="18" cy="18" r="10" fill="none" stroke="currentColor" strokeWidth="2.5" />
        <path d="M26 26l8 8" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      <h2>No matching labs found</h2>
      <p>Try another test name or pincode.</p>
      {query && (
        <p className="state-detail">
          Nothing found for “{query.query}” in {query.pincode}.
        </p>
      )}
    </div>
  );
}
