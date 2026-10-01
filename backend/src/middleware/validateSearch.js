const { ApiError } = require('../utils/errors');

const PINCODE_PATTERN = /^\d{6}$/;
const MAX_QUERY_LENGTH = 100;

/** Validates and normalizes GET /api/search query params, attaching them to req.searchParams. */
function validateSearch(req, _res, next) {
  const { search_query: rawQuery, pincode: rawPincode } = req.query;

  // Repeated params (?a=1&a=2) arrive as arrays; treat anything non-string as invalid.
  const searchQuery = typeof rawQuery === 'string' ? rawQuery.trim() : '';
  if (!searchQuery) {
    return next(new ApiError(400, 'INVALID_SEARCH_QUERY', 'Please enter a test name.'));
  }
  if (searchQuery.length > MAX_QUERY_LENGTH) {
    return next(
      new ApiError(400, 'INVALID_SEARCH_QUERY', `Test name must be ${MAX_QUERY_LENGTH} characters or fewer.`)
    );
  }

  const pincode = typeof rawPincode === 'string' ? rawPincode.trim() : '';
  if (!PINCODE_PATTERN.test(pincode)) {
    return next(new ApiError(400, 'INVALID_PINCODE', 'Please enter a valid 6-digit pincode.'));
  }

  req.searchParams = { searchQuery, pincode };
  next();
}

module.exports = { validateSearch };
