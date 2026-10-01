export default function ErrorState({ message, onRetry }) {
  return (
    <div className="state-box state-error" role="alert">
      <h2>We couldn’t complete your search</h2>
      <p>{message}</p>
      {onRetry && (
        <button type="button" className="btn-secondary" onClick={onRetry}>
          Try again
        </button>
      )}
    </div>
  );
}
