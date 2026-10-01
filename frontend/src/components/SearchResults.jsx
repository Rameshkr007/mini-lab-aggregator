import ResultCard from './ResultCard.jsx';
import { formatResultCount } from '../utils/format.js';

export default function SearchResults({ count, results, searchQuery }) {
  return (
    <div>
      <div className="results-head">
        <h2>{formatResultCount(count)}</h2>
        <p>Sorted by lowest final price</p>
      </div>
      <ul className="results-list">
        {results.map((item, index) => (
          <li key={item.id}>
            <ResultCard item={item} searchQuery={searchQuery} isLowest={index === 0} />
          </li>
        ))}
      </ul>
    </div>
  );
}
