import { useCallback, useEffect, useRef, useState } from 'react';
import SearchForm from './components/SearchForm.jsx';
import SearchResults from './components/SearchResults.jsx';
import LoadingState from './components/LoadingState.jsx';
import EmptyState from './components/EmptyState.jsx';
import ErrorState from './components/ErrorState.jsx';
import { searchLabs } from './services/api.js';

export default function App() {
  const [state, setState] = useState({ status: 'idle' });
  const abortRef = useRef(null);
  const resultsRef = useRef(null);

  const handleSearch = useCallback(async ({ query, pincode }) => {
    abortRef.current?.abort(); // a newer search always wins
    const controller = new AbortController();
    abortRef.current = controller;

    setState({ status: 'loading' });
    try {
      const data = await searchLabs({ query, pincode, signal: controller.signal });
      setState({ status: 'success', data });
    } catch (err) {
      if (err.name === 'AbortError') return;
      if (err.code === 'NO_RESULTS') {
        setState({ status: 'empty', query: { query, pincode } });
      } else {
        setState({ status: 'error', message: err.message, retry: { query, pincode } });
      }
    }
  }, []);

  useEffect(() => () => abortRef.current?.abort(), []);

  // On small screens the results start below the fold; bring them into view.
  useEffect(() => {
    if (state.status === 'idle' || state.status === 'loading') return;
    const el = resultsRef.current;
    if (el && el.getBoundingClientRect().top > window.innerHeight * 0.75) {
      el.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [state.status]);

  const loading = state.status === 'loading';

  return (
    <>
      <header className="hero">
        <div className="container">
          <p className="brand">
            <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true">
              <rect width="24" height="24" rx="6" fill="currentColor" />
              <path d="M12 6v12M6 12h12" stroke="#0F2A3D" strokeWidth="3" strokeLinecap="round" />
            </svg>
            Mini Lab Aggregator
          </p>
          <h1>
            Find the right diagnostic test{' '}
            <br />
            at the right price.
          </h1>
          <p className="hero-sub">
            Compare available labs and packages{' '}
            <br className="br-desktop" />
            based on your location.
          </p>
        </div>
      </header>

      <main className="container main">
        <SearchForm onSearch={handleSearch} loading={loading} />

        <section className="results-area" ref={resultsRef} aria-live="polite" aria-busy={loading}>
          {state.status === 'loading' && <LoadingState />}
          {state.status === 'success' && (
            <SearchResults
              count={state.data.count}
              results={state.data.results}
              searchQuery={state.data.query.search_query}
            />
          )}
          {state.status === 'empty' && <EmptyState query={state.query} />}
          {state.status === 'error' && (
            <ErrorState message={state.message} onRetry={() => handleSearch(state.retry)} />
          )}
        </section>
      </main>

      <footer className="footer">
        <div className="container">
          Prices are from mock data for demonstration. Final price is the offer price plus any home
          collection fee.
        </div>
      </footer>
    </>
  );
}
