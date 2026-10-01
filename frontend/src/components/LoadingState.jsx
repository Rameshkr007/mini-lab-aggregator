export default function LoadingState() {
  return (
    <div role="status" aria-label="Searching available labs">
      <p className="loading-text">Searching available labs...</p>
      <ul className="results-list" aria-hidden="true">
        {[0, 1, 2].map((i) => (
          <li key={i}>
            <div className="card skeleton-card">
              <div className="card-main">
                <div className="sk sk-line w40" />
                <div className="sk sk-line w70 tall" />
                <div className="sk sk-line w55" />
              </div>
              <div className="price-panel">
                <div className="sk sk-line w50" />
                <div className="sk sk-line w80 tall" />
              </div>
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
