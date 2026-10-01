const PINCODE_PATTERN = /^\d{6}$/;

/** Returns an object of field errors; empty object means valid. Messages mirror the API. */
export function validateSearchInputs({ query, pincode }) {
  const errors = {};
  if (!String(query ?? '').trim()) errors.query = 'Please enter a test name.';
  if (!PINCODE_PATTERN.test(String(pincode ?? '').trim())) {
    errors.pincode = 'Please enter a valid 6-digit pincode.';
  }
  return errors;
}

/** Case/whitespace-insensitive check used to highlight the searched test inside a package. */
export function matchesTerm(text, term) {
  const norm = (s) => String(s ?? '').trim().replace(/\s+/g, ' ').toLowerCase();
  const t = norm(term);
  return t.length > 0 && norm(text).includes(t);
}
