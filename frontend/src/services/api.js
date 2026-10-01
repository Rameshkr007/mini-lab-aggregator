const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').replace(/\/$/, '');

const GENERIC_ERROR = 'Something went wrong. Please try again.';

export class ApiClientError extends Error {
  constructor(code, message, status) {
    super(message);
    this.name = 'ApiClientError';
    this.code = code;
    this.status = status;
  }
}

/**
 * Calls GET /api/search. Resolves with the parsed success payload,
 * or rejects with ApiClientError (code NO_RESULTS for empty searches).
 */
export async function searchLabs({ query, pincode, signal }) {
  const params = new URLSearchParams({ search_query: query.trim(), pincode: pincode.trim() });

  let response;
  try {
    response = await fetch(`${API_BASE_URL}/api/search?${params}`, { signal });
  } catch (err) {
    if (err.name === 'AbortError') throw err;
    throw new ApiClientError('NETWORK_ERROR', GENERIC_ERROR, 0);
  }

  let body = null;
  try {
    body = await response.json();
  } catch {
    /* non-JSON response; handled below */
  }

  if (response.ok && body?.success) return body;

  const apiError = body?.error;
  // Only surface server messages for client-side problems; hide 5xx details.
  const message = apiError?.message && response.status < 500 ? apiError.message : GENERIC_ERROR;
  throw new ApiClientError(apiError?.code || 'UNKNOWN_ERROR', message, response.status);
}
