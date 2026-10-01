import { useId, useState } from 'react';
import { validateSearchInputs } from '../utils/validate.js';

const EXAMPLES = [
  { query: 'Lipid Profile', pincode: '110001' },
  { query: 'MRI Brain', pincode: '560034' },
  { query: 'HbA1c', pincode: '110002' },
];

export default function SearchForm({ onSearch, loading }) {
  const [query, setQuery] = useState('');
  const [pincode, setPincode] = useState('');
  const [errors, setErrors] = useState({});
  const uid = useId();
  const ids = {
    query: `${uid}-query`,
    queryErr: `${uid}-query-err`,
    pincode: `${uid}-pincode`,
    pincodeErr: `${uid}-pincode-err`,
  };

  function submit(values) {
    const found = validateSearchInputs(values);
    setErrors(found);
    if (Object.keys(found).length > 0) return;
    onSearch({ query: values.query.trim(), pincode: values.pincode.trim() });
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (loading) return;
    submit({ query, pincode });
  }

  function runExample(example) {
    if (loading) return;
    setQuery(example.query);
    setPincode(example.pincode);
    submit(example);
  }

  return (
    <div className="search-panel">
      <form className="search-form" onSubmit={handleSubmit} noValidate>
        <div className="field field-query">
          <label htmlFor={ids.query}>Test name</label>
          <input
            id={ids.query}
            type="text"
            value={query}
            placeholder="Search for a test e.g. Lipid Profile"
            autoComplete="off"
            maxLength={100}
            aria-invalid={errors.query ? 'true' : undefined}
            aria-describedby={errors.query ? ids.queryErr : undefined}
            onChange={(e) => setQuery(e.target.value)}
          />
          {errors.query && (
            <p className="field-error" id={ids.queryErr}>
              {errors.query}
            </p>
          )}
        </div>

        <div className="field field-pincode">
          <label htmlFor={ids.pincode}>Pincode</label>
          <input
            id={ids.pincode}
            type="text"
            inputMode="numeric"
            value={pincode}
            placeholder="Enter 6-digit pincode"
            autoComplete="postal-code"
            maxLength={6}
            aria-invalid={errors.pincode ? 'true' : undefined}
            aria-describedby={errors.pincode ? ids.pincodeErr : undefined}
            onChange={(e) => setPincode(e.target.value.replace(/\D/g, ''))}
          />
          {errors.pincode && (
            <p className="field-error" id={ids.pincodeErr}>
              {errors.pincode}
            </p>
          )}
        </div>

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? (
            <>
              <span className="spinner" aria-hidden="true" />
              Searching
            </>
          ) : (
            'Search'
          )}
        </button>
      </form>

      <div className="examples">
        <span>Try</span>
        {EXAMPLES.map((ex) => (
          <button
            key={ex.query}
            type="button"
            className="example-chip"
            onClick={() => runExample(ex)}
            disabled={loading}
          >
            {ex.query} in {ex.pincode}
          </button>
        ))}
      </div>
    </div>
  );
}
